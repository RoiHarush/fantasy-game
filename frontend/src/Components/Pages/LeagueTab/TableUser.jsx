import Link from "next/link";

import { getLeagueMemberPointsHref } from "../../../features/league/model";

function TableUser({ user, currentUser }) {
    const href = getLeagueMemberPointsHref(user.id, currentUser.id);

    return (
        <Link href={href} className="flex min-w-0 flex-col items-start gap-0.5 no-underline" aria-label={`View ${user.fantasyTeamName} points`}>
            <span className="max-w-[130px] overflow-hidden text-sm font-semibold text-ellipsis whitespace-nowrap text-inherit sm:max-w-none sm:text-base">{user.name}</span>
            <span className="max-w-full overflow-hidden text-xs text-ellipsis whitespace-nowrap text-current opacity-65">{user.fantasyTeamName}</span>
        </Link>
    );
}

export default TableUser;
