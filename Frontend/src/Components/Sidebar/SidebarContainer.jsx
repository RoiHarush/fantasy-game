import styles from "../../Styles/SidebarContainer.module.css";

function SidebarContainer({ children }) {
    return <div className={styles.sidebar}>{children}</div>;
}

export default SidebarContainer;
