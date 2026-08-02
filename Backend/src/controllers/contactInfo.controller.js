const ContactInfo = require("../models/contactInfo.model");

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const CONTACT_INFO_POPULATE_FIELDS = {
  path: "updatedBy",
  select: "fullName email role",
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

// ==================================================
// Get Current User ID
// ==================================================

const getCurrentUserId = (req) => {
  return req.user?._id || req.user?.id || null;
};

// ==================================================
// Normalize Phones
// ==================================================

const normalizePhones = (phones) => {
  if (!Array.isArray(phones)) {
    return [];
  }

  return phones
    .map((phone) => String(phone).trim())
    .filter(Boolean);
};

// ==================================================
// Normalize Social Links
// ==================================================

const normalizeSocialLinks = (
  socialLinks = {},
) => {
  return {
    facebook:
      socialLinks.facebook?.trim() || "",

    instagram:
      socialLinks.instagram?.trim() || "",

    linkedin:
      socialLinks.linkedin?.trim() || "",

    whatsapp:
      socialLinks.whatsapp?.trim() || "",
  };
};

/*
|--------------------------------------------------------------------------
| Contact Info Controller
|--------------------------------------------------------------------------
*/

class ContactInfoController {
  /*
  |--------------------------------------------------------------------------
  | Public
  |--------------------------------------------------------------------------
  */

  // ==================================================
  // Get Public Contact Information
  // ==================================================

  getPublicContactInfo = async (
    req,
    res,
  ) => {
    const contactInfo =
      await ContactInfo.findOne({
        isActive: true,
      })
        .select(
          "title description address phones primaryPhone email workingHours emergencyHours socialLinks",
        )
        .lean();

    if (!contactInfo) {
      return res.status(404).json({
        success: false,
        message:
          "Contact information is not available.",
      });
    }

    return res.status(200).json({
      success: true,
      data: contactInfo,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Dashboard
  |--------------------------------------------------------------------------
  */

  // ==================================================
  // Get Contact Information
  // ==================================================

  getContactInfo = async (
    req,
    res,
  ) => {
    const contactInfo =
      await ContactInfo.findOne()
        .populate(
          CONTACT_INFO_POPULATE_FIELDS,
        )
        .lean();

    if (!contactInfo) {
      return res.status(404).json({
        success: false,
        message:
          "Contact information has not been created yet.",
      });
    }

    return res.status(200).json({
      success: true,
      data: contactInfo,
    });
  };

  // ==================================================
  // Create Or Update Contact Information
  // ==================================================

  saveContactInfo = async (
    req,
    res,
  ) => {
    const {
      title,
      description,
      address,
      phones,
      primaryPhone,
      email,
      workingHours,
      emergencyHours,
      socialLinks,
      isActive,
    } = req.body;

    const currentUserId =
      getCurrentUserId(req);

    let contactInfo =
      await ContactInfo.findOne();

    const contactData = {
      title,
      description,
      address,

      phones:
        normalizePhones(phones),

      primaryPhone,

      email,

      workingHours,

      emergencyHours,

      socialLinks:
        normalizeSocialLinks(
          socialLinks,
        ),

      isActive,

      updatedBy:
        currentUserId,
    };

    if (!contactInfo) {
      contactInfo =
        await ContactInfo.create(
          contactData,
        );

      await contactInfo.populate(
        CONTACT_INFO_POPULATE_FIELDS,
      );

      return res.status(201).json({
        success: true,

        message:
          "Contact information created successfully.",

        data: contactInfo,
      });
    }

    Object.assign(
      contactInfo,
      contactData,
    );

    await contactInfo.save();

    await contactInfo.populate(
      CONTACT_INFO_POPULATE_FIELDS,
    );

    return res.status(200).json({
      success: true,

      message:
        "Contact information updated successfully.",

      data: contactInfo,
    });
  };
}

module.exports =
  new ContactInfoController();