import { forwardRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowDown,
    faArrowLeft,
    faArrowRight,
    faArrowRightFromBracket,
    faArrowRotateLeft,
    faArrowUp,
    faBars,
    faBell,
    faBinoculars,
    faCalendarDays,
    faCalendarXmark,
    faChartColumn,
    faCheck,
    faChevronDown,
    faChevronUp,
    faCircleCheck,
    faCircleInfo,
    faCircleStop,
    faClipboard,
    faCrown,
    faDownload,
    faEnvelope,
    faEye,
    faEyeSlash,
    faFire,
    faFlask,
    faFloppyDisk,
    faForwardStep,
    faFutbol,
    faGaugeHigh,
    faGlasses,
    faGripVertical,
    faHeartPulse,
    faImage,
    faKey,
    faList,
    faLock,
    faMagnifyingGlass,
    faMinus,
    faMoon,
    faPen,
    faPlay,
    faPlus,
    faRepeat,
    faRightLeft,
    faRobot,
    faScaleBalanced,
    faShield,
    faShieldHeart,
    faShirt,
    faShuffle,
    faSliders,
    faSpinner,
    faStar,
    faSun,
    faTableList,
    faTrashCan,
    faTriangleExclamation,
    faTrophy,
    faUnlock,
    faUser,
    faUserPlus,
    faUsers,
    faWandMagicSparkles,
    faWaveSquare,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";

function createAppIcon(iconDefinition, displayName) {
    const AppIcon = forwardRef(function AppIcon(props, ref) {
        const normalizedProps = { ...props };
        const requestedSize = normalizedProps.size;
        const originalStyle = normalizedProps.style;

        delete normalizedProps.size;
        delete normalizedProps.strokeWidth;
        delete normalizedProps.absoluteStrokeWidth;

        return (
            <FontAwesomeIcon
                ref={ref}
                icon={iconDefinition}
                fixedWidth
                {...normalizedProps}
                style={requestedSize
                    ? { ...originalStyle, width: requestedSize, height: requestedSize }
                    : originalStyle}
            />
        );
    });

    AppIcon.displayName = displayName;
    return AppIcon;
}

export const Activity = createAppIcon(faWaveSquare, "ActivityIcon");
export const AlertTriangle = createAppIcon(faTriangleExclamation, "AlertTriangleIcon");
export const ArrowDown = createAppIcon(faArrowDown, "ArrowDownIcon");
export const ArrowDownLeft = createAppIcon(faArrowDown, "ArrowDownLeftIcon");
export const ArrowDownToLine = createAppIcon(faDownload, "ArrowDownToLineIcon");
export const ArrowDownUp = createAppIcon(faRightLeft, "ArrowDownUpIcon");
export const ArrowLeft = createAppIcon(faArrowLeft, "ArrowLeftIcon");
export const ArrowLeftRight = createAppIcon(faRightLeft, "ArrowLeftRightIcon");
export const ArrowRight = createAppIcon(faArrowRight, "ArrowRightIcon");
export const ArrowRightLeft = createAppIcon(faRightLeft, "ArrowRightLeftIcon");
export const ArrowUpRight = createAppIcon(faArrowUp, "ArrowUpRightIcon");
export const BadgeCheck = createAppIcon(faCircleCheck, "BadgeCheckIcon");
export const Beaker = createAppIcon(faFlask, "BeakerIcon");
export const Bell = createAppIcon(faBell, "BellIcon");
export const Binoculars = createAppIcon(faBinoculars, "BinocularsIcon");
export const Bot = createAppIcon(faRobot, "BotIcon");
export const CalendarClock = createAppIcon(faCalendarDays, "CalendarClockIcon");
export const CalendarDays = createAppIcon(faCalendarDays, "CalendarDaysIcon");
export const CalendarX2 = createAppIcon(faCalendarXmark, "CalendarXIcon");
export const ChartNoAxesColumnIncreasing = createAppIcon(faChartColumn, "ChartIcon");
export const Check = createAppIcon(faCheck, "CheckIcon");
export const CheckCircle2 = createAppIcon(faCircleCheck, "CheckCircleIcon");
export const ChevronDown = createAppIcon(faChevronDown, "ChevronDownIcon");
export const ChevronUp = createAppIcon(faChevronUp, "ChevronUpIcon");
export const CircleStop = createAppIcon(faCircleStop, "CircleStopIcon");
export const Clipboard = createAppIcon(faClipboard, "ClipboardIcon");
export const Compare = createAppIcon(faScaleBalanced, "CompareIcon");
export const Clock3 = createAppIcon(faCalendarDays, "ClockIcon");
export const Crown = createAppIcon(faCrown, "CrownIcon");
export const Eye = createAppIcon(faEye, "EyeIcon");
export const EyeOff = createAppIcon(faEyeSlash, "EyeOffIcon");
export const Flame = createAppIcon(faFire, "FlameIcon");
export const Goal = createAppIcon(faFutbol, "GoalIcon");
export const GripVertical = createAppIcon(faGripVertical, "GripVerticalIcon");
export const HeartPulse = createAppIcon(faHeartPulse, "HeartPulseIcon");
export const ImagePlus = createAppIcon(faImage, "ImagePlusIcon");
export const Info = createAppIcon(faCircleInfo, "InfoIcon");
export const KeyRound = createAppIcon(faKey, "KeyIcon");
export const ListPlus = createAppIcon(faList, "ListPlusIcon");
export const LoaderCircle = createAppIcon(faSpinner, "LoaderIcon");
export const LockKeyhole = createAppIcon(faLock, "LockIcon");
export const LogOut = createAppIcon(faArrowRightFromBracket, "LogoutIcon");
export const Mail = createAppIcon(faEnvelope, "MailIcon");
export const MailWarning = createAppIcon(faEnvelope, "MailWarningIcon");
export const Menu = createAppIcon(faBars, "MenuIcon");
export const Minus = createAppIcon(faMinus, "MinusIcon");
export const Moon = createAppIcon(faMoon, "MoonIcon");
export const Pencil = createAppIcon(faPen, "PencilIcon");
export const Play = createAppIcon(faPlay, "PlayIcon");
export const Plus = createAppIcon(faPlus, "PlusIcon");
export const Repeat2 = createAppIcon(faRepeat, "RepeatIcon");
export const RotateCcw = createAppIcon(faArrowRotateLeft, "RotateIcon");
export const RotateCcwKey = createAppIcon(faKey, "ResetKeyIcon");
export const Rows3 = createAppIcon(faTableList, "RowsIcon");
export const Save = createAppIcon(faFloppyDisk, "SaveIcon");
export const Search = createAppIcon(faMagnifyingGlass, "SearchIcon");
export const Settings2 = createAppIcon(faSliders, "SettingsIcon");
export const ShieldAlert = createAppIcon(faShield, "ShieldAlertIcon");
export const ShieldCheck = createAppIcon(faShield, "ShieldCheckIcon");
export const ShieldPlus = createAppIcon(faShieldHeart, "ShieldPlusIcon");
export const Shirt = createAppIcon(faShirt, "ShirtIcon");
export const Shuffle = createAppIcon(faShuffle, "ShuffleIcon");
export const SkipForward = createAppIcon(faForwardStep, "SkipForwardIcon");
export const SlidersHorizontal = createAppIcon(faSliders, "FiltersIcon");
export const Sparkles = createAppIcon(faWandMagicSparkles, "SparklesIcon");
export const StepForward = createAppIcon(faForwardStep, "StepForwardIcon");
export const Star = createAppIcon(faStar, "StarIcon");
export const Sun = createAppIcon(faSun, "SunIcon");
export const Trash2 = createAppIcon(faTrashCan, "TrashIcon");
export const TriangleAlert = createAppIcon(faTriangleExclamation, "TriangleAlertIcon");
export const Trophy = createAppIcon(faTrophy, "TrophyIcon");
export const UnlockKeyhole = createAppIcon(faUnlock, "UnlockIcon");
export const UserRound = createAppIcon(faUser, "UserIcon");
export const Users = createAppIcon(faUsers, "UsersIcon");
export const UsersRound = createAppIcon(faUsers, "UsersRoundIcon");
export const WaiverAdd = createAppIcon(faUserPlus, "WaiverAddIcon");
export const X = createAppIcon(faXmark, "CloseIcon");

export const MobileStatusIcon = createAppIcon(faGaugeHigh, "MobileStatusIcon");
export const MobilePointsIcon = Trophy;
export const MobileTeamIcon = Users;
export const MobileScoutIcon = createAppIcon(faGlasses, "MobileScoutIcon");
export const MobileTransfersIcon = ArrowRightLeft;
