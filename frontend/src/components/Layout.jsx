import Navbar from '../components/Navbar';  
import Footer from '../components/Footer';
import {supabase} from '@/config/supabaseClient';
import { use, useEffect, useState } from 'react';

const Layout = ({children}) =>{
    //This is where we will store the user session
const [user, setUser] = useState(null);

useEffect(() =>{
    const fetchSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
        console.error('Error fetching session:', error.message);
        return;
    }
    if (data?.session?.user) {
        setUser(data.session.user);
    }
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user || null)});

    return () => {
    authListener?.subscription.unsubscribe();
    };
}, []);

    return(
        <div>
            <Navbar user={user}/>
            {children}
            <Footer/>
        </div>
    )
}
export default Layout;
 