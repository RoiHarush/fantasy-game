import Link from "next/link";

import { getLeagueMemberPointsHref } from "../../../features/league/model";
import TeamIdentityImage from "../../../shared/ui/TeamIdentityImage";

function TableUser({ user, currentUser, pointsHref }) {
    const href = pointsHref ?? getLeagueMemberPointsHref(user.id, currentUser.id);

    return (
        <Link href={href} className="flex min-w-0 items-center gap-2.5 no-underline" aria-label={`View ${user.fantasyTeamName} points`}>
            <TeamIdentityImage
                src={user.logoPath}
                alt=""
                className="size-9 shrink-0 rounded-lg shadow-none sm:size-10"
                sizes="2.5rem"
            />
            <span className="flex min-w-0 flex-col items-start gap-0.5">
                <span className="max-w-[105px] overflow-hidden text-sm font-semibold text-ellipsis whitespace-nowrap text-inherit sm:max-w-none sm:text-base">{user.fantasyTeamName}</span>
                <span className="max-w-full overflow-hidden text-xs text-ellipsis whitespace-nowrap text-current opacity-65">{user.name}</span>
            </span>
        </Link>
    );
}

export default TableUser;
