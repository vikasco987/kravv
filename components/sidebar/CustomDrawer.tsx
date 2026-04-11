import React, { useState } from "react";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { useClerk, useUser, useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLanguage } from "../../context/LanguageContext";
import { useRefresh } from "../../context/RefreshContext";

// Modular Sidebar Components (Now in same folder)
import SidebarHeader from "./SidebarHeader";
import SidebarItems from "./SidebarItems";
import SidebarModals from "./SidebarModals";

export default function CustomDrawerContent(props: any) {
    const { user, isSignedIn } = useUser();
    const { signOut } = useClerk();
    const { getToken } = useAuth();
    const router = useRouter();
    const { t } = useLanguage();
    
    // Modal Visibility State
    const [modals, setModals] = useState({
        login: false,
        qr: false,
        editMenu: false,
        inventory: false,
        profit: false,
        voice: false,
        history: false
    });

    // Data for AI features
    const [allBills, setAllBills] = useState([]);
    const [menus, setMenus] = useState([]);

    const fetchAIData = async () => {
        try {
            const authToken = await getToken();
            if (!authToken) return;

            const billRes = await fetch("https://billing.kravy.in/api/bill-manager", {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            if (billRes.ok) {
                const data = await billRes.json();
                setAllBills(data.bills || []);
            }

            const cachedMenu = await AsyncStorage.getItem('@cached_menu');
            if (cachedMenu) setMenus(JSON.parse(cachedMenu));
        } catch (e) {
            console.error("CustomDrawer AI fetch error:", e);
        }
    };

    const handleAction = (type: string) => {
        if (!isSignedIn && type !== 'signIn') {
            setModals({ ...modals, login: true });
            return;
        }

        switch (type) {
            case 'orders': props.navigation.navigate("(tabs)", { screen: "orders" }); break;
            case 'settings': props.navigation.navigate("(tabs)", { screen: "setting" }); break;
            case 'qr': 
                props.navigation.closeDrawer();
                setModals({ ...modals, qr: true });
                break;
            case 'editMenu':
                props.navigation.closeDrawer();
                setTimeout(() => setModals({ ...modals, editMenu: true }), 400);
                break;
            case 'inventory':
                props.navigation.closeDrawer();
                setTimeout(() => setModals({ ...modals, inventory: true }), 400);
                break;
            case 'profit':
                fetchAIData();
                props.navigation.closeDrawer();
                setTimeout(() => setModals({ ...modals, profit: true }), 400);
                break;
            case 'voice':
                fetchAIData();
                props.navigation.closeDrawer();
                setTimeout(() => setModals({ ...modals, voice: true }), 400);
                break;
            case 'history':
                fetchAIData();
                props.navigation.closeDrawer();
                setTimeout(() => setModals({ ...modals, history: true }), 400);
                break;
            case 'signIn':
                router.push("/(auth)/sign-in");
                break;
        }
    };

    const handleLogout = async () => {
        await signOut();
        router.replace("/(auth)/sign-in");
    };

    return (
        <>
            <DrawerContentScrollView {...props}>
                <SidebarHeader user={user} t={t} />
                
                <SidebarItems 
                    t={t} 
                    navigation={props.navigation} 
                    isSignedIn={isSignedIn}
                    onAction={handleAction}
                    onLogout={handleLogout}
                />
            </DrawerContentScrollView>

            <SidebarModals 
                modals={modals} 
                setModals={setModals}
                data={{ allBills, menus }}
                onSignIn={() => {
                    setModals({ ...modals, login: false });
                    router.push("/(auth)/sign-in");
                }}
            />
        </>
    );
}
