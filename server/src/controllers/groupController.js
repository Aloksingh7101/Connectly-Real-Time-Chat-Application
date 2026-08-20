const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');

// Every mutating group operation re-checks this — a valid, authenticated
// user still needs to actually be an admin of THIS group to manage it.
function assertIsAdmin(conversation, userId) {
  const isAdmin = conversation.groupAdmins.some((a) => String(a) === String(userId));
  if (!isAdmin) {
    throw new ApiError(403, 'Only group admins can perform this action');
  }
}

function assertIsMember(conversation, userId) {
  const isMember = conversation.participants.some((p) => String(p) === String(userId));
  if (!isMember) {
    throw new ApiError(403, 'You are not a member of this group');
  }
}

// POST /api/groups
const createGroup = asyncHandler(async (req, res) => {
  const { groupName, participantIds, groupAvatar } = req.body;

  if (!groupName?.trim()) throw new ApiError(400, 'groupName is required');
  if (!Array.isArray(participantIds) || participantIds.length < 1) {
    throw new ApiError(400, 'At least one other participant is required');
  }

  // Creator is automatically a participant and the first admin.
  const participants = [...new Set([String(req.user._id), ...participantIds])];

  const group = await Conversation.create({
    isGroup: true,
    groupName: groupName.trim(),
    groupAvatar: groupAvatar || '',
    participants,
    groupAdmins: [req.user._id],
  });

  const populated = await group.populate('participants', '-password');

  // Notify everyone added (except the creator) that they've been added to a group.
  for (const userId of participants) {
    if (String(userId) === String(req.user._id)) continue;
    await Notification.create({
      recipient: userId,
      sender: req.user._id,
      type: 'group_add',
      conversation: group._id,
    });
  }

  res.status(201).json({ success: true, data: { conversation: populated } });
});

// PUT /api/groups/:id — rename and/or change group image. Admin only.
const updateGroup = asyncHandler(async (req, res) => {
  const group = await Conversation.findById(req.params.id);
  if (!group || !group.isGroup) throw new ApiError(404, 'Group not found');

  assertIsAdmin(group, req.user._id);

  const { groupName, groupAvatar } = req.body;
  if (groupName !== undefined) group.groupName = groupName.trim();
  if (groupAvatar !== undefined) group.groupAvatar = groupAvatar;

  await group.save();
  const populated = await group.populate('participants', '-password');
  res.status(200).json({ success: true, data: { conversation: populated } });
});

// POST /api/groups/:id/members — add members. Admin only.
const addMembers = asyncHandler(async (req, res) => {
  const { memberIds } = req.body;
  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    throw new ApiError(400, 'memberIds is required');
  }

  const group = await Conversation.findById(req.params.id);
  if (!group || !group.isGroup) throw new ApiError(404, 'Group not found');

  assertIsAdmin(group, req.user._id);

  const newMembers = memberIds.filter(
    (id) => !group.participants.some((p) => String(p) === String(id))
  );
  group.participants.push(...newMembers);
  await group.save();

  for (const userId of newMembers) {
    await Notification.create({
      recipient: userId,
      sender: req.user._id,
      type: 'group_add',
      conversation: group._id,
    });
  }

  const populated = await group.populate('participants', '-password');
  res.status(200).json({ success: true, data: { conversation: populated } });
});

// DELETE /api/groups/:id/members/:userId — remove a member. Admin only.
const removeMember = asyncHandler(async (req, res) => {
  const group = await Conversation.findById(req.params.id);
  if (!group || !group.isGroup) throw new ApiError(404, 'Group not found');

  assertIsAdmin(group, req.user._id);

  group.participants = group.participants.filter(
    (p) => String(p) !== String(req.params.userId)
  );
  group.groupAdmins = group.groupAdmins.filter(
    (a) => String(a) !== String(req.params.userId)
  );
  await group.save();

  const populated = await group.populate('participants', '-password');
  res.status(200).json({ success: true, data: { conversation: populated } });
});

// POST /api/groups/:id/leave — any member can leave, no admin check needed.
const leaveGroup = asyncHandler(async (req, res) => {
  const group = await Conversation.findById(req.params.id);
  if (!group || !group.isGroup) throw new ApiError(404, 'Group not found');

  assertIsMember(group, req.user._id);

  group.participants = group.participants.filter((p) => String(p) !== String(req.user._id));
  group.groupAdmins = group.groupAdmins.filter((a) => String(a) !== String(req.user._id));

  // If the last admin leaves but members remain, promote the earliest
  // remaining participant so the group is never left admin-less.
  if (group.groupAdmins.length === 0 && group.participants.length > 0) {
    group.groupAdmins = [group.participants[0]];
  }

  await group.save();
  res.status(200).json({ success: true, message: 'Left the group' });
});

module.exports = { createGroup, updateGroup, addMembers, removeMember, leaveGroup };
