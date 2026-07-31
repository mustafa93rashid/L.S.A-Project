const Project = require("../models/project.model");
const Service = require("../models/service.model");

const { uploadMulterImage, replaceImage, deleteImage } = require("../services/cloudinary.service");

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const parseJsonField = (value, fallback) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value !== "string") {
    return value;
  }

  return JSON.parse(value);
};

const uploadProjectMainImages = async (cardImageFile, heroImageFile) => {
  const uploadedImages = {
    cardImage: null,
    heroImage: null,
  };

  try {
    if (cardImageFile) {
      uploadedImages.cardImage = await uploadMulterImage({
        file: cardImageFile,
        folder: "projects/cards",
        prefix: "project-card",
      });
    }

    if (heroImageFile) {
      uploadedImages.heroImage = await uploadMulterImage({
        file: heroImageFile,
        folder: "projects/hero",
        prefix: "project-hero",
      });
    }

    return uploadedImages;
  } catch (error) {
    if (uploadedImages.cardImage?.publicId) {
      await deleteImage(uploadedImages.cardImage.publicId);
    }

    if (uploadedImages.heroImage?.publicId) {
      await deleteImage(uploadedImages.heroImage.publicId);
    }

    throw error;
  }
};

const uploadProjectGallery = async (files = [], altValues = []) => {
  const uploadedGallery = [];

  try {
    for (let index = 0; index < files.length; index += 1) {
      const uploadedImage = await uploadMulterImage({
        file: files[index],
        folder: "projects/gallery",
        prefix: "project-gallery",
      });

      uploadedGallery.push({
        url: uploadedImage.url,
        publicId: uploadedImage.publicId,
        alt: altValues[index] || "",
        displayOrder: index,
      });
    }

    return uploadedGallery;
  } catch (error) {
    await Promise.all(
      uploadedGallery.map((image) => deleteImage(image.publicId)),
    );

    throw error;
  }
};

const uploadProjectCertificates = async (files = [], certificateData = []) => {
  const uploadedCertificates = [];

  try {
    for (let index = 0; index < files.length; index += 1) {
      const uploadedImage = await uploadMulterImage({
        file: files[index],
        folder: "projects/certificates",
        prefix: "project-certificate",
      });

      uploadedCertificates.push({
        title: certificateData[index]?.title || "",
        description: certificateData[index]?.description || "",
        image: {
          url: uploadedImage.url,
          publicId: uploadedImage.publicId,
        },
      });
    }

    return uploadedCertificates;
  } catch (error) {
    await Promise.all(
      uploadedCertificates.map((certificate) =>
        deleteImage(certificate.image.publicId),
      ),
    );

    throw error;
  }
};

const replaceProjectMainImages = async (project, cardImageFile, heroImageFile) => {
  if (cardImageFile) {
    project.cardImage = await replaceImage({
      oldPublicId: project.cardImage?.publicId,
      file: cardImageFile,
      folder: "projects/cards",
      prefix: "project-card",
    });
  }

  if (heroImageFile) {
    project.hero.image = await replaceImage({
      oldPublicId: project.hero?.image?.publicId,
      file: heroImageFile,
      folder: "projects/hero",
      prefix: "project-hero",
    });
  }
};

const deleteProjectImages = async (project) => {
  const publicIds = [];

  if (project.cardImage?.publicId) {
    publicIds.push(project.cardImage.publicId);
  }

  if (project.hero?.image?.publicId) {
    publicIds.push(project.hero.image.publicId);
  }

  project.gallery.forEach((image) => {
    if (image.publicId) {
      publicIds.push(image.publicId);
    }
  });

  project.certificates.forEach((certificate) => {
    if (certificate.image?.publicId) {
      publicIds.push(certificate.image.publicId);
    }
  });

  await Promise.all(publicIds.map((publicId) => deleteImage(publicId)));
};

/*
|--------------------------------------------------------------------------
| Project Controller
|--------------------------------------------------------------------------
*/

class ProjectController {
  /*
  |--------------------------------------------------------------------------
  | Get Public Projects
  |--------------------------------------------------------------------------
  */

  getPublicProjects = async (req, res) => {
    const filter = {
      isActive: true,
    };

    if (req.query.featured === "true") {
      filter.isFeatured = true;
    }

    if (req.query.service) {
      filter.services = req.query.service;
    }

    const projects = await Project.find(filter)
      .populate("services", "title slug categoryLabel")
      .sort({
        displayOrder: 1,
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Get Public Project By Slug
  |--------------------------------------------------------------------------
  */

  getPublicProjectBySlug = async (req, res) => {
    const project = await Project.findOne({
      slug: req.params.slug,
      isActive: true,
    }).populate("services", "title slug categoryLabel shortDescription cardImage");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    return res.status(200).json({
      success: true,
      project,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Get All Projects
  |--------------------------------------------------------------------------
  */

  getAllProjects = async (req, res) => {
    const projects = await Project.find()
      .populate("services", "title slug categoryLabel")
      .populate("createdBy", "fullName email")
      .populate("updatedBy", "fullName email")
      .sort({
        displayOrder: 1,
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Get Project By ID
  |--------------------------------------------------------------------------
  */

  getProjectById = async (req, res) => {
    const project = await Project.findById(req.params.id)
      .populate("services", "title slug categoryLabel")
      .populate("createdBy", "fullName email")
      .populate("updatedBy", "fullName email");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    return res.status(200).json({
      success: true,
      project,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Create Project
  |--------------------------------------------------------------------------
  */

  createProject = async (req, res) => {
    const existingProject = await Project.findOne({
      slug: req.body.slug,
    });

    if (existingProject) {
      return res.status(409).json({
        success: false,
        message: "A project with this slug already exists.",
      });
    }

    const services = parseJsonField(req.body.services, []);
    const galleryAlt = parseJsonField(req.body.galleryAlt, []);
    const certificates = parseJsonField(req.body.certificates, []);
    const projectDetails = parseJsonField(req.body.projectDetails, {});
    const detailedScope = parseJsonField(req.body.detailedScope, {});

    const existingServicesCount = await Service.countDocuments({
      _id: {
        $in: services,
      },
    });

    if (existingServicesCount !== services.length) {
      return res.status(400).json({
        success: false,
        message: "One or more selected services do not exist.",
      });
    }

    const cardImageFile = req.files?.cardImage?.[0];
    const heroImageFile = req.files?.heroImage?.[0];
    const galleryFiles = req.files?.gallery || [];
    const certificateFiles = req.files?.certificateImages || [];

    if (!cardImageFile || !heroImageFile) {
      return res.status(400).json({
        success: false,
        message: "Card image and hero image are required.",
      });
    }

    const uploadedMainImages = await uploadProjectMainImages(
      cardImageFile,
      heroImageFile,
    );

    let uploadedGallery = [];
    let uploadedCertificates = [];

    try {
      uploadedGallery = await uploadProjectGallery(galleryFiles, galleryAlt);

      uploadedCertificates = await uploadProjectCertificates(
        certificateFiles,
        certificates,
      );

      const project = await Project.create({
        title: req.body.title,
        slug: req.body.slug,
        categoryLabel: req.body.categoryLabel,
        shortDescription: req.body.shortDescription,
        description: req.body.description,
        services,
        hero: {
          title: req.body.heroTitle,
          description: req.body.heroDescription,
          image: uploadedMainImages.heroImage,
        },
        cardImage: uploadedMainImages.cardImage,
        projectDetails,
        detailedScope,
        gallery: uploadedGallery,
        certificates: uploadedCertificates,
        displayOrder: req.body.displayOrder,
        isFeatured: req.body.isFeatured,
        isActive: req.body.isActive,
        createdBy: req.user._id,
        updatedBy: req.user._id,
      });

      await project.populate("services", "title slug categoryLabel");

      return res.status(201).json({
        success: true,
        message: "Project created successfully.",
        project,
      });
    } catch (error) {
      if (uploadedMainImages.cardImage?.publicId) {
        await deleteImage(uploadedMainImages.cardImage.publicId);
      }

      if (uploadedMainImages.heroImage?.publicId) {
        await deleteImage(uploadedMainImages.heroImage.publicId);
      }

      await Promise.all(
        uploadedGallery.map((image) => deleteImage(image.publicId)),
      );

      await Promise.all(
        uploadedCertificates.map((certificate) =>
          deleteImage(certificate.image.publicId),
        ),
      );

      throw error;
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Update Project
  |--------------------------------------------------------------------------
  */

  updateProject = async (req, res) => {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    if (req.body.slug && req.body.slug !== project.slug) {
      const existingProject = await Project.findOne({
        slug: req.body.slug,
        _id: {
          $ne: project._id,
        },
      });

      if (existingProject) {
        return res.status(409).json({
          success: false,
          message: "A project with this slug already exists.",
        });
      }
    }

    const simpleFields = [
      "title",
      "slug",
      "categoryLabel",
      "shortDescription",
      "description",
      "displayOrder",
      "isFeatured",
      "isActive",
    ];

    simpleFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    });

    if (req.body.services !== undefined) {
      const services = parseJsonField(req.body.services, []);

      const existingServicesCount = await Service.countDocuments({
        _id: {
          $in: services,
        },
      });

      if (existingServicesCount !== services.length) {
        return res.status(400).json({
          success: false,
          message: "One or more selected services do not exist.",
        });
      }

      project.services = services;
    }

    if (req.body.heroTitle !== undefined) {
      project.hero.title = req.body.heroTitle;
    }

    if (req.body.heroDescription !== undefined) {
      project.hero.description = req.body.heroDescription;
    }

    if (req.body.projectDetails !== undefined) {
      project.projectDetails = parseJsonField(req.body.projectDetails, {});
    }

    if (req.body.detailedScope !== undefined) {
      project.detailedScope = parseJsonField(req.body.detailedScope, {});
    }

    const cardImageFile = req.files?.cardImage?.[0];
    const heroImageFile = req.files?.heroImage?.[0];

    await replaceProjectMainImages(
      project,
      cardImageFile,
      heroImageFile,
    );

    if (req.body.removeGalleryPublicIds !== undefined) {
      const publicIds = parseJsonField(
        req.body.removeGalleryPublicIds,
        [],
      );

      const imagesToDelete = project.gallery.filter((image) =>
        publicIds.includes(image.publicId),
      );

      await Promise.all(
        imagesToDelete.map((image) => deleteImage(image.publicId)),
      );

      project.gallery = project.gallery.filter(
        (image) => !publicIds.includes(image.publicId),
      );
    }

    const newGalleryFiles = req.files?.gallery || [];

    if (newGalleryFiles.length > 0) {
      const galleryAlt = parseJsonField(req.body.galleryAlt, []);

      const newGalleryImages = await uploadProjectGallery(
        newGalleryFiles,
        galleryAlt,
      );

      const startingOrder = project.gallery.length;

      newGalleryImages.forEach((image, index) => {
        image.displayOrder = startingOrder + index;
      });

      project.gallery.push(...newGalleryImages);
    }

    if (req.body.removeCertificatePublicIds !== undefined) {
      const publicIds = parseJsonField(
        req.body.removeCertificatePublicIds,
        [],
      );

      const certificatesToDelete = project.certificates.filter(
        (certificate) =>
          publicIds.includes(certificate.image?.publicId),
      );

      await Promise.all(
        certificatesToDelete.map((certificate) =>
          deleteImage(certificate.image.publicId),
        ),
      );

      project.certificates = project.certificates.filter(
        (certificate) =>
          !publicIds.includes(certificate.image?.publicId),
      );
    }

    const newCertificateFiles = req.files?.certificateImages || [];

    if (newCertificateFiles.length > 0) {
      const certificates = parseJsonField(req.body.certificates, []);

      const newCertificates = await uploadProjectCertificates(
        newCertificateFiles,
        certificates,
      );

      project.certificates.push(...newCertificates);
    }

    project.updatedBy = req.user.id;

    await project.save();

    await project.populate("services", "title slug categoryLabel");

    return res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      project,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Delete Project
  |--------------------------------------------------------------------------
  */

  deleteProject = async (req, res) => {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    await deleteProjectImages(project);

    await project.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully.",
    });
  };
}

module.exports = new ProjectController();