const { ContactMessage } = require("../models/contactMessage.model");

const {
  CONTACT_MESSAGE_POPULATE_FIELDS,
  getCurrentUserId,
  buildDashboardFilter,
  buildPagination,
  buildPaginationResponse,
  processContactMessageSideEffects,
  applyContactMessageStatus,
  buildContactMessageStatistics,
} = require("../helpers/contactMessage.helper");

// ==================== Contact Message Controller ====================

class ContactMessageController {
  // ==================== Create Contact Message ====================

  createContactMessage = async (req, res) => {
    const { fullName, email, phone, service, projectDescription } = req.body;

    const contactMessage = await ContactMessage.create({
      fullName,
      email,
      phone,

      service: service || "General Inquiry",

      projectDescription,

      status: "new",
    });

    await processContactMessageSideEffects({
      contactMessage,
    });

    return res.status(201).json({
      success: true,

      message:
        "Your message has been received successfully. Our team will contact you soon.",

      data: {
        _id: contactMessage._id,

        fullName: contactMessage.fullName,

        email: contactMessage.email,

        phone: contactMessage.phone,

        service: contactMessage.service,

        projectDescription: contactMessage.projectDescription,

        status: contactMessage.status,

        customerEmailSent: contactMessage.customerEmailSent,

        dashboardNotificationCreated:
          contactMessage.dashboardNotificationCreated,

        createdAt: contactMessage.createdAt,
      },
    });
  };

  // ==================== Get All Contact Messages ====================

  getAllContactMessages = async (req, res) => {
    const filter = buildDashboardFilter(req.query);

    const { page, limit, skip } = buildPagination(req.query);

    const [contactMessages, total] = await Promise.all([
      ContactMessage.find(filter)
        .populate(CONTACT_MESSAGE_POPULATE_FIELDS)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      ContactMessage.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,

      count: contactMessages.length,

      pagination: buildPaginationResponse({
        page,
        limit,
        total,
      }),

      data: contactMessages,
    });
  };

  // ==================== Get Contact Message By ID ====================

  getContactMessageById = async (req, res) => {
    const contactMessage = await ContactMessage.findById(req.params.id)
      .populate(CONTACT_MESSAGE_POPULATE_FIELDS)
      .lean();

    if (!contactMessage) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: contactMessage,
    });
  };

  // ==================== Update Contact Message Status ====================

  updateContactMessageStatus = async (req, res) => {
    const contactMessage = await ContactMessage.findById(req.params.id);

    if (!contactMessage) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    const { status } = req.body;

    const statusChanged = applyContactMessageStatus(contactMessage, status);

    if (!statusChanged) {
      await contactMessage.populate(CONTACT_MESSAGE_POPULATE_FIELDS);

      return res.status(200).json({
        success: true,
        message: "Contact message already has this status",
        data: contactMessage,
      });
    }

    contactMessage.updatedBy = getCurrentUserId(req);

    await contactMessage.save();

    await contactMessage.populate(CONTACT_MESSAGE_POPULATE_FIELDS);

    return res.status(200).json({
      success: true,
      message: "Contact message status updated successfully",
      data: contactMessage,
    });
  };

  // ==================== Delete Contact Message ====================

  deleteContactMessage = async (req, res) => {
    const contactMessage = await ContactMessage.findById(req.params.id);

    if (!contactMessage) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    await contactMessage.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Contact message deleted successfully",
    });
  };

  // ==================== Get Contact Message Statistics ====================

  getContactMessageStatistics = async (req, res) => {
    const statistics = await buildContactMessageStatistics();

    return res.status(200).json({
      success: true,
      data: statistics,
    });
  };
}

module.exports = new ContactMessageController();
