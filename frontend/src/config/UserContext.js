"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/config/supabaseClient";

const UserContext = createContext(null);

export const GlobalUser = ({children}) =>{
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

return <UserContext.Provider value={user}>{children}</UserContext.Provider>
};

export const globalUser = () => useContext(UserContext);
