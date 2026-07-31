const TeamMember = require(
  "../models/teamMember.model",
);

const {
  uploadMulterImage,
  replaceImage,
  deleteImage,
} = require(
  "../services/cloudinary.service",
);

class TeamMemberController {
  // ==================== Get Public Team Members ====================
  getPublicTeamMembers = async (req, res) => {
    const teamMembers = await TeamMember.find(
      {
        isActive: true,
      },
      "fullName position experience image displayOrder",
    )
      .sort({
        displayOrder: 1,
        createdAt: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: teamMembers.length,
      data: teamMembers,
    });
  };

  // ==================== Get All Team Members ====================
  getAllTeamMembers = async (req, res) => {
    const teamMembers = await TeamMember.find()
      .sort({
        displayOrder: 1,
        createdAt: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: teamMembers.length,
      data: teamMembers,
    });
  };

  // ==================== Create Team Member ====================
  createTeamMember = async (req, res) => {
    const {
      fullName,
      position,
      experience,
      displayOrder,
      isActive,
    } = req.body;

    let uploadedImage = null;

    try {
      uploadedImage =
        await uploadMulterImage({
          file: req.file,
          folder: "team-members",
          prefix: "team-member",
        });

      const teamMember =
        await TeamMember.create({
          fullName,
          position,
          experience,

          image: {
            url: uploadedImage.url,
            publicId:
              uploadedImage.publicId,
          },

          displayOrder:
            displayOrder !== undefined
              ? Number(displayOrder)
              : 0,

          isActive:
            isActive !== undefined
              ? isActive === true ||
                isActive === "true"
              : true,
        });

      return res.status(201).json({
        success: true,
        message:
          "Team member created successfully",
        data: teamMember,
      });
    } catch (error) {
      if (uploadedImage?.publicId) {
        try {
          await deleteImage(
            uploadedImage.publicId,
          );
        } catch (deleteError) {
          console.error(
            "Failed to delete uploaded team member image:",
            {
              publicId:
                uploadedImage.publicId,
              message:
                deleteError.message,
            },
          );
        }
      }

      throw error;
    }
  };

    // ==================== Update Team Member ====================
  updateTeamMember = async (req, res) => {
    const teamMember =
      await TeamMember.findById(
        req.params.id,
      );

    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: "Team member not found",
      });
    }

    const {
      fullName,
      position,
      experience,
      displayOrder,
      isActive,
    } = req.body;

    if (req.file) {
      const updatedImage =
        await replaceImage({
          oldPublicId:
            teamMember.image?.publicId,
          file: req.file,
          folder: "team-members",
          prefix: "team-member",
        });

      teamMember.image = {
        url: updatedImage.url,
        publicId:
          updatedImage.publicId,
      };
    }

    if (fullName !== undefined) {
      teamMember.fullName = fullName;
    }

    if (position !== undefined) {
      teamMember.position = position;
    }

    if (experience !== undefined) {
      teamMember.experience =
        experience;
    }

    if (displayOrder !== undefined) {
      teamMember.displayOrder =
        Number(displayOrder);
    }

    if (isActive !== undefined) {
      teamMember.isActive =
        isActive === true ||
        isActive === "true";
    }

    await teamMember.save();

    return res.status(200).json({
      success: true,
      message:
        "Team member updated successfully",
      data: teamMember,
    });
  };

  // ==================== Delete Team Member ====================
  deleteTeamMember = async (req, res) => {
    const teamMember =
      await TeamMember.findById(
        req.params.id,
      );

    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: "Team member not found",
      });
    }

    if (teamMember.image?.publicId) {
      await deleteImage(
        teamMember.image.publicId,
      );
    }

    await teamMember.deleteOne();

    return res.status(200).json({
      success: true,
      message:
        "Team member deleted successfully",
    });
  };
}

module.exports =
  new TeamMemberController();