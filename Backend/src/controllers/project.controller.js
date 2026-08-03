const Project = require("../models/project.model");

const { deleteImages } = require("../services/cloudinary.service");

const {
  normalizeSlug,
  selectedServicesExist,
  uploadProjectMainImages,
  uploadProjectGallery,
  uploadProjectCertificates,
  replaceProjectMainImages,
  removeImagesByPublicIds,
  deleteProjectImages,
  updateProjectHero,
  updateProjectDetails,
  updateDetailedScope,
} = require("../helpers/project.helper");

// ==================== Project Controller ====================

class ProjectController {
  // ==================== Get Public Projects ====================

  getPublicProjects = async (req, res) => {
    const filter = {
      isActive: true,
    };

    if (req.query.featured !== undefined) {
      filter.isFeatured = req.query.featured;
    }

    if (req.query.service) {
      filter.services = req.query.service;
    }

    const projects = await Project.find(filter)
      .select(
        "title slug categoryLabel shortDescription services cardImage displayOrder isFeatured",
      )
      .populate("services", "title slug")
      .sort({
        displayOrder: 1,
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  };

  // ==================== Get Public Project By Slug ====================

  getPublicProjectBySlug = async (req, res) => {
    const project = await Project.findOne({
      slug: req.params.slug,
      isActive: true,
    })
      .select(
        "-cardImage.publicId -hero.image.publicId -gallery.publicId -certificates.publicId",
      )
      .populate("services", "title slug serviceCard")
      .lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: project,
    });
  };

  // ==================== Get All Projects ====================

  getAllProjects = async (req, res) => {
    const projects = await Project.find()
      .populate("services", "title slug")
      .populate("createdBy", "fullName email role")
      .populate("updatedBy", "fullName email role")
      .sort({
        displayOrder: 1,
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  };

  // ==================== Get Project By ID ====================

  getProjectById = async (req, res) => {
    const project = await Project.findById(req.params.id)
      .populate("services", "title slug")
      .populate("createdBy", "fullName email role")
      .populate("updatedBy", "fullName email role")
      .lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: project,
    });
  };

  // ==================== Create Project ====================

  createProject = async (req, res) => {
    const {
      title,
      slug,
      categoryLabel,
      shortDescription,
      description,
      services,
      heroTitle,
      heroDescription,
      heroImageAlt,
      cardImageAlt,
      projectDetails,
      detailedScope,
      galleryAlt,
      certificateAlt,
      displayOrder,
      isFeatured,
      isActive,
    } = req.body;

    const normalizedSlug = normalizeSlug(slug);

    const existingProject = await Project.findOne({
      slug: normalizedSlug,
    }).lean();

    if (existingProject) {
      return res.status(409).json({
        success: false,
        message: "A project with this slug already exists",
      });
    }

    const servicesExist = await selectedServicesExist(services);

    if (!servicesExist) {
      return res.status(400).json({
        success: false,
        message: "One or more selected services do not exist",
      });
    }

    const cardImageFile = req.files?.cardImage?.[0];

    const heroImageFile = req.files?.heroImage?.[0];

    const galleryFiles = req.files?.gallery || [];

    const certificateFiles = req.files?.certificateImages || [];

    const uploadedMainImages = await uploadProjectMainImages({
      cardImageFile,
      heroImageFile,

      cardImageAlt: cardImageAlt || title,

      heroImageAlt: heroImageAlt || title,
    });

    let uploadedGallery = [];
    let uploadedCertificates = [];

    try {
      uploadedGallery = await uploadProjectGallery({
        files: galleryFiles,
        altValues: galleryAlt,
      });

      uploadedCertificates = await uploadProjectCertificates({
        files: certificateFiles,

        altValues: certificateAlt,
      });

      const project = await Project.create({
        title,
        slug: normalizedSlug,
        categoryLabel,
        shortDescription,
        description,
        services,

        hero: {
          title: heroTitle,
          description: heroDescription,

          image: uploadedMainImages.heroImage,
        },

        cardImage: uploadedMainImages.cardImage,

        projectDetails,
        detailedScope,

        gallery: uploadedGallery,

        certificates: uploadedCertificates,

        displayOrder,
        isFeatured,
        isActive,

        createdBy: req.user._id,

        updatedBy: req.user._id,
      });

      await project.populate("services", "title slug");

      return res.status(201).json({
        success: true,
        message: "Project created successfully",
        data: project,
      });
    } catch (error) {
      await deleteImages(
        [
          uploadedMainImages.cardImage?.publicId,

          uploadedMainImages.heroImage?.publicId,

          ...uploadedGallery.map((image) => image.publicId),

          ...uploadedCertificates.map((image) => image.publicId),
        ].filter(Boolean),
      );

      throw error;
    }
  };

  // ==================== Update Project ====================

  updateProject = async (req, res) => {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const {
      title,
      slug,
      categoryLabel,
      shortDescription,
      description,
      services,
      heroTitle,
      heroDescription,
      heroImageAlt,
      cardImageAlt,
      projectDetails,
      detailedScope,
      galleryAlt,
      certificateAlt,
      removeGalleryPublicIds,
      removeCertificatePublicIds,
      displayOrder,
      isFeatured,
      isActive,
    } = req.body;

    if (slug !== undefined) {
      const normalizedSlug = normalizeSlug(slug);

      if (normalizedSlug !== project.slug) {
        const existingProject = await Project.findOne({
          slug: normalizedSlug,

          _id: {
            $ne: project._id,
          },
        }).lean();

        if (existingProject) {
          return res.status(409).json({
            success: false,
            message: "A project with this slug already exists",
          });
        }
      }

      project.slug = normalizedSlug;
    }

    if (services !== undefined) {
      const servicesExist = await selectedServicesExist(services);

      if (!servicesExist) {
        return res.status(400).json({
          success: false,
          message: "One or more selected services do not exist",
        });
      }

      project.services = services;
    }

    const simpleFields = {
      title,
      categoryLabel,
      shortDescription,
      description,
      displayOrder,
      isFeatured,
      isActive,
    };

    Object.entries(simpleFields).forEach(([field, value]) => {
      if (value !== undefined) {
        project[field] = value;
      }
    });

    updateProjectHero(project, {
      heroTitle,
      heroDescription,
    });

    updateProjectDetails(project, projectDetails);

    updateDetailedScope(project, detailedScope);

    await replaceProjectMainImages({
      project,

      cardImageFile: req.files?.cardImage?.[0],

      heroImageFile: req.files?.heroImage?.[0],

      cardImageAlt,
      heroImageAlt,
    });

    if (removeGalleryPublicIds !== undefined) {
      project.gallery = await removeImagesByPublicIds({
        currentImages: project.gallery,

        publicIds: removeGalleryPublicIds,
      });
    }

    const newGalleryFiles = req.files?.gallery || [];

    if (newGalleryFiles.length > 0) {
      const newGalleryImages = await uploadProjectGallery({
        files: newGalleryFiles,
        altValues: galleryAlt,

        startingOrder: project.gallery.length,
      });

      project.gallery.push(...newGalleryImages);
    }

    if (removeCertificatePublicIds !== undefined) {
      project.certificates = await removeImagesByPublicIds({
        currentImages: project.certificates,

        publicIds: removeCertificatePublicIds,
      });
    }

    const newCertificateFiles = req.files?.certificateImages || [];

    if (newCertificateFiles.length > 0) {
      const newCertificates = await uploadProjectCertificates({
        files: newCertificateFiles,

        altValues: certificateAlt,

        startingOrder: project.certificates.length,
      });

      project.certificates.push(...newCertificates);
    }

    project.updatedBy = req.user._id;

    await project.save();

    await project.populate("services", "title slug");

    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: project,
    });
  };

  // ==================== Delete Project ====================

  deleteProject = async (req, res) => {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    await deleteProjectImages(project);

    await project.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  };
}

module.exports = new ProjectController();
