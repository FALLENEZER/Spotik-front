import styles from './Navbar.module.css'

type NavbarProps = {
}

function Navbar() {


  return (
    <div className={styles.navbar_container}>
      <div className={styles.navbar}>
        <img className={styles.navbar_logo_image} src="" alt="#" />
        <div className={styles.navbar_menu}></div>
        <div className={styles.navbar_user_profile}></div>
      </div>
    </div>
  )


}

export {Navbar}
