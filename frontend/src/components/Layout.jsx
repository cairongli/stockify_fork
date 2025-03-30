import Navbar from '../components/Navbar';  
import Footer from '../components/Footer';
import { GlobalUser } from '@/config/UserContext';

const Layout = ({children}) =>{
    return(
        <GlobalUser>
            <Navbar/>
            {children}
            <Footer/>
        </GlobalUser>
    )
}
export default Layout;
 