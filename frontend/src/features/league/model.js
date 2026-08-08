export function isSameEntityId(left, right) {
    return left != null && right != null && String(left) === String(right);
}

export function getLeagueMemberPointsHref(memberId, currentUserId) {
    return isSameEntityId(memberId, currentUserId) ? "/points" : `/points/${memberId}`;
}
