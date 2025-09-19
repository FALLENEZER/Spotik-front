import { Maincontent } from "../MainContent/Maincontent"
import { Playbar } from "../PlayBar/Playbar"
import styles from "./Mainarea.module.css"

type Props = {}

function Mainarea () {
  return (
    <div className={styles.mainarea_container}>
        <Maincontent></Maincontent>
        <Playbar></Playbar>
    </div>
  )
}

export {Mainarea}