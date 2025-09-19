import styles from './App.module.css'
import { Mainarea } from './components/MainArea/Mainarea'
import { Navbar } from './components/NavBar/Navbar'

function App() {
  return (
    <>
      <div className={styles.app_container}>
        <Navbar></Navbar>
        <Mainarea></Mainarea>
      </div>
    </>
  )
}

export default App
