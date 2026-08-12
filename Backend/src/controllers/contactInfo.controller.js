const ContactInfo = require("../models/contactInfo.model");

class ContactInfoController {
  // ==================== Get Public Contact Information ====================

  getPublicContactInfo = async (req, res) => {
    const contactInfo = await ContactInfo.findOne({
      isActive: true,
    })
      .select(
        "title description location phones primaryPhone email workingHours emergencyHours socialLinks",
      )
      .lean();

    if (!contactInfo) {
      return res.status(404).json({
        success: false,
        message: "Contact information is not available",
      });
    }

    return res.status(200).json({
      success: true,
      data: contactInfo,
    });
  };

  // ==================== Get Contact Information ====================

  getContactInfo = async (req, res) => {
    const contactInfo = await ContactInfo.findOne()
      .populate("updatedBy", "fullName email role")
      .lean();

    if (!contactInfo) {
      return res.status(404).json({
        success: false,
        message: "Contact information has not been created yet",
      });
    }

    return res.status(200).json({
      success: true,
      data: contactInfo,
    });
  };

  // ==================== Create Or Update Contact Information ====================

  saveContactInfo = async (req, res) => {
    const {
      title,
      description,
      location,
      phones,
      primaryPhone,
      email,
      workingHours,
      emergencyHours,
      socialLinks,
      isActive,
    } = req.body;

    const currentUserId = req.user?._id || req.user?.id || null;

    let contactInfo = await ContactInfo.findOne();

    if (!contactInfo) {
      contactInfo = await ContactInfo.create({
        title,
        description,
        location,
        phones,
        primaryPhone,
        email,
        workingHours,
        emergencyHours,
        socialLinks,
        isActive,
        updatedBy: currentUserId,
      });

      await contactInfo.populate("updatedBy", "fullName email role");

      return res.status(201).json({
        success: true,
        message: "Contact information created successfully",
        data: contactInfo,
      });
    }

    if (title !== undefined) {
      contactInfo.title = title;
    }

    if (description !== undefined) {
      contactInfo.description = description;
    }

    if (location !== undefined) {
      if (!contactInfo.location) {
        contactInfo.location = {};
      }

      if (location.address !== undefined) {
        contactInfo.location.address = location.address;
      }

      if (location.mapUrl !== undefined) {
        contactInfo.location.mapUrl = location.mapUrl;
      }
    }

    if (phones !== undefined) {
      contactInfo.phones = phones;
    }

    if (primaryPhone !== undefined) {
      contactInfo.primaryPhone = primaryPhone;
    }

    if (email !== undefined) {
      contactInfo.email = email;
    }

    if (workingHours !== undefined) {
      contactInfo.workingHours = workingHours;
    }

    if (emergencyHours !== undefined) {
      contactInfo.emergencyHours = emergencyHours;
    }

    if (socialLinks !== undefined) {
      if (!contactInfo.socialLinks) {
        contactInfo.socialLinks = {};
      }

      if (socialLinks.facebook !== undefined) {
        contactInfo.socialLinks.facebook = socialLinks.facebook;
      }

      if (socialLinks.instagram !== undefined) {
        contactInfo.socialLinks.instagram = socialLinks.instagram;
      }

      if (socialLinks.linkedin !== undefined) {
        contactInfo.socialLinks.linkedin = socialLinks.linkedin;
      }

      if (socialLinks.whatsapp !== undefined) {
        contactInfo.socialLinks.whatsapp = socialLinks.whatsapp;
      }
    }

    if (isActive !== undefined) {
      contactInfo.isActive = isActive;
    }

    contactInfo.updatedBy = currentUserId;

    await contactInfo.save();

    await contactInfo.populate("updatedBy", "fullName email role");

    return res.status(200).json({
      success: true,
      message: "Contact information updated successfully",
      data: contactInfo,
    });
  };
}

module.exports = new ContactInfoController();
