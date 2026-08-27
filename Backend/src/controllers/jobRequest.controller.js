const { JobRequest } = require("../models/jobRequest.model");

const { Job } = require("../models/job.model");

const {
  JOB_REQUEST_POPULATE_FIELDS,
  getCurrentUserId,
  buildDashboardFilter,
  buildPagination,
  buildPaginationResponse,
  uploadCv,
  deleteCvSafely,
  processJobRequestSideEffects,
  sendStatusEmailSafely,
  updateJobRequestStatus,
  buildJobRequestStatistics,
  jobApplicationExists,
} = require("../helpers/jobRequest.helper");

// ==================== Job Request Controller ====================

class JobRequestController {
// ==================== Create Job Request ====================

createJobRequest = async (req, res) => {
  let uploadedCv = null;

  const {
    job: jobId,
    firstName,
    lastName,
    email,
    phone,
    clientRequestId,
  } = req.body;

  // ==================== Check Existing Request ====================
  //
  // مهم جدًا أن يتم هذا قبل:
  // - البحث عن duplicate application
  // - رفع CV
  // - إرسال Email
  // - إنشاء Notification

  const existingJobRequest =
    await JobRequest.findOne({
      clientRequestId,
    }).populate(
      "job",
      "title location employmentType department status deadline",
    );

  if (existingJobRequest) {
    return res.status(200).json({
      success: true,

      alreadyReceived: true,

      message:
        "Your application has already been received successfully.",

      data:
        existingJobRequest,
    });
  }

  try {
    // ==================== Find Job ====================

    const job =
      await Job.findById(
        jobId,
      );

    if (!job) {
      return res.status(404).json({
        success: false,

        message:
          "Job not found",
      });
    }

    // ==================== Check Job Status ====================

    if (
      job.status !==
      "published"
    ) {
      return res.status(400).json({
        success: false,

        message:
          "This job is not currently available",
      });
    }

    // ==================== Check Duplicate Application ====================
    //
    // هذا يختلف عن clientRequestId.
    //
    // clientRequestId:
    // يمنع تكرار نفس محاولة الإرسال.
    //
    // job + email:
    // يمنع الشخص من التقديم مرة ثانية على نفس الوظيفة.

    const exists =
      await jobApplicationExists({
        JobRequest,
        jobId,
        email,
      });

    if (exists) {
      return res.status(409).json({
        success: false,

        message:
          "You have already applied for this job",
      });
    }

    // ==================== Upload CV ====================

    uploadedCv =
      await uploadCv(
        req.file,
      );

    let jobRequest;

    try {
      // ==================== Create Job Request ====================

      jobRequest =
        await JobRequest.create({
          job:
            jobId,

          clientRequestId,

          firstName,

          lastName,

          email,

          phone,

          cv:
            uploadedCv,

          status:
            "new",
        });
    } catch (error) {
      // ==================== Race Condition Protection ====================

      const isClientRequestIdDuplicate =
        error?.code === 11000 &&
        (
          error?.keyPattern
            ?.clientRequestId ||
          error?.keyValue
            ?.clientRequestId
        );

      if (
        isClientRequestIdDuplicate
      ) {
        // نحن رفعنا CV لهذه المحاولة،
        // لكن Mongo أخبرنا أن نفس request
        // تم إنشاؤه بالفعل من طلب آخر.
        //
        // لذلك يجب حذف CV الزائد.

        if (uploadedCv) {
          await deleteCvSafely(
            uploadedCv,
          );

          uploadedCv = null;
        }

        const duplicateJobRequest =
          await JobRequest.findOne({
            clientRequestId,
          }).populate(
            "job",
            "title location employmentType department status deadline",
          );

        if (
          duplicateJobRequest
        ) {
          return res.status(200).json({
            success: true,

            alreadyReceived: true,

            message:
              "Your application has already been received successfully.",

            data:
              duplicateJobRequest,
          });
        }
      }

      throw error;
    }

    // ==================== Prevent Cleanup ====================
    //
    // الـCV أصبح مرتبطًا الآن بـJobRequest ناجح.
    // لذلك لا نريد حذفه في catch الخارجي.

    uploadedCv = null;

    // ==================== Send Success Response ====================

    res.status(201).json({
      success: true,

      alreadyReceived: false,

      message:
        "Your application has been submitted successfully",

      data:
        jobRequest,
    });

    // ==================== Side Effects ====================
    //
    // تعمل فقط عند إنشاء JobRequest جديد.
    //
    // Retry لنفس clientRequestId لن يصل إلى هنا.

    void processJobRequestSideEffects({
      jobRequest,
      job,
    }).catch((error) => {
      console.error(
        "Job request side effects failed:",
        {
          jobRequestId:
            jobRequest._id,

          message:
            error.message,
        },
      );
    });

    return;
  } catch (error) {
    // ==================== Cleanup CV ====================
    //
    // إذا تم رفع CV لكن فشلت العملية قبل حفظ
    // JobRequest، نحذفه من Cloudinary.

    if (uploadedCv) {
      await deleteCvSafely(
        uploadedCv,
      );
    }

    throw error;
  }
}; 

  // ==================== Get All Job Requests ====================

  getAllJobRequests = async (req, res) => {
    const filter = buildDashboardFilter(req.query);

    const { page, limit, skip } = buildPagination(req.query);

    const [requests, total] = await Promise.all([
      JobRequest.find(filter)
        .populate(JOB_REQUEST_POPULATE_FIELDS)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      JobRequest.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: requests.length,

      pagination: buildPaginationResponse({
        page,
        limit,
        total,
      }),

      data: requests,
    });
  };

  // ==================== Get Job Request By ID ====================

  getJobRequestById = async (req, res) => {
    const jobRequest = await JobRequest.findById(req.params.id)
      .populate(JOB_REQUEST_POPULATE_FIELDS)
      .lean();

    if (!jobRequest) {
      return res.status(404).json({
        success: false,
        message: "Job request not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: jobRequest,
    });
  };

// ==================== Update Job Request Status ====================

updateJobRequestStatus = async (req, res) => {
  const jobRequest = await JobRequest.findById(req.params.id).populate(
    "job",
    "title location employmentType department",
  );

  if (!jobRequest) {
    return res.status(404).json({
      success: false,
      message: "Job request not found",
    });
  }

  const { status } = req.body;

  updateJobRequestStatus(jobRequest, status);

  jobRequest.updatedBy = getCurrentUserId(req);

  await jobRequest.save();

  await jobRequest.populate("updatedBy", "fullName email role");

  // ==================== Send Success Response ====================

  res.status(200).json({
    success: true,
    message: "Job request status updated successfully",
    data: jobRequest,
  });

  // ==================== Send Status Email ====================
  // لا ننتظر الإيميل ولا نربط نجاح العملية به

  void sendStatusEmailSafely({
    jobRequest,
    job: jobRequest.job,
    status,
  }).catch((error) => {
    console.error("Job request status side effect failed:", {
      jobRequestId: jobRequest._id,
      status,
      message: error.message,
    });
  });

  return;
};

  // ==================== Delete Job Request ====================

  deleteJobRequest = async (req, res) => {
    const jobRequest = await JobRequest.findById(req.params.id);

    if (!jobRequest) {
      return res.status(404).json({
        success: false,
        message: "Job request not found",
      });
    }

    const cv = jobRequest.cv?.toObject
      ? jobRequest.cv.toObject()
      : jobRequest.cv;

    await jobRequest.deleteOne();

    await deleteCvSafely(cv);

    return res.status(200).json({
      success: true,
      message: "Job request deleted successfully",
    });
  };

  // ==================== Get Job Request Statistics ====================

  getJobRequestStatistics = async (req, res) => {
    const statistics = await buildJobRequestStatistics(JobRequest);

    return res.status(200).json({
      success: true,
      data: statistics,
    });
  };
}

module.exports = new JobRequestController();
