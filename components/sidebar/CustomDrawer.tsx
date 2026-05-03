import { useAuth, useClerk, useUser } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useRefresh } from "../../context/RefreshContext";
import { DeviceEventEmitter } from "react-native";

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
    const { refreshSignal } = useRefresh();

    const [staffMember, setStaffMember] = useState<any>(null);

    React.useEffect(() => {
        const checkStaff = async () => {
            const session = await AsyncStorage.getItem("staff_session");
            if (session) {
                setStaffMember(JSON.parse(session));
            } else {
                setStaffMember(null);
            }
        };
        checkStaff();
    }, [refreshSignal]);

    // Modal Visibility State
    const [modals, setModals] = useState({
        login: false,
        qr: false,
        editMenu: false,
        inventory: false,
        profit: false,
        voice: false,
        history: false,
        billHistory: false
    });

    // Data for AI features
    const [allBills, setAllBills] = useState([]);
    const [menus, setMenus] = useState([]);
    const [parties, setParties] = useState([]);

    const fetchAIData = async () => {
        try {
            // Safety Check: Fetch if we have ANY active session (Clerk or Staff)
            const staffSession = await AsyncStorage.getItem("staff_session");
            const isStaff = !!staffSession;

            if (!isSignedIn && !isStaff) return;

            let authToken: string | null = null;
            if (isSignedIn) {
                authToken = await getToken();
            }

            // If it's a staff member without a Clerk token, we might need a different way 
            // to call the API or the API might need to be unprotected/differently protected.
            // For now, assuming staff uses the same API but we might need to handle token null.
            if (isSignedIn && !authToken) return;

            const billRes = await fetch("https://billing.kravy.in/api/bill-manager", {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            if (billRes.ok) {
                const data = await billRes.json();
                setAllBills(data.bills || []);
            }

            const cachedMenu = await AsyncStorage.getItem('@cached_menu');
            if (cachedMenu) setMenus(JSON.parse(cachedMenu));

            const partyRes = await fetch("https://billing.kravy.in/api/parties", {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            if (partyRes.ok) {
                const pData = await partyRes.json();
                setParties(pData || []);
            }
        } catch (e) {
            console.error("CustomDrawer AI fetch error:", e);
        }
    };

    const handleAction = (type: string) => {
        if (!isSignedIn && !staffMember && type !== 'signIn') {
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
            case 'billHistory':
                props.navigation.closeDrawer();
                setTimeout(() => setModals({ ...modals, billHistory: true }), 400);
                break;
            case 'signIn':
                router.push("/(auth)/sign-in");
                break;
        }
    };

    const handleLogout = async () => {
        // 1. Preserve critical non-sensitive preferences
        const currentLang = await AsyncStorage.getItem("app_language");
        const savedPrinter = await AsyncStorage.getItem("saved_printer");

        const session = await AsyncStorage.getItem("staff_session");
        if (session) {
            try {
                const staff = JSON.parse(session);
                console.log("---------------- STAFF LOGOUT TOKEN ---------------");
                console.log(`[TOKEN-STAFF-LOGOUT] SUCCESS`);
                console.log(`STAFF NAME : ${staff.name}`);
                console.log(`TIME      : ${new Date().toLocaleString()}`);
                console.log("--------------------------------------------------");
            } catch (e) {
                console.log("[TOKEN-STAFF-LOGOUT] ERROR: Session corrupt");
            }
        }

        // 2. Clear ALL business data to ensure NO data leaks between users
        await AsyncStorage.clear();

        // 3. Restore preferences
        if (currentLang) await AsyncStorage.setItem("app_language", currentLang);
        if (savedPrinter) await AsyncStorage.setItem("saved_printer", savedPrinter);

        // 4. Sign out from Clerk if active
        if (isSignedIn) {
            await signOut();
        }
        
        // 5. Reset local state and signal update
        setStaffMember(null);
        DeviceEventEmitter.emit('PERMISSIONS_UPDATED');

        // 6. Force immediate redirect to sign-in
        router.replace("/(auth)/sign-in");
    };

    return (
        <>
            <DrawerContentScrollView {...props}>
                <SidebarHeader user={user || staffMember} t={t} />

                <SidebarItems
                    t={t}
                    navigation={props.navigation}
                    isSignedIn={isSignedIn || !!staffMember}
                    onAction={handleAction}
                    onLogout={handleLogout}
                />
            </DrawerContentScrollView>

            <SidebarModals
                modals={modals}
                setModals={setModals}
                data={{ allBills, menus, parties }}
                onSignIn={() => {
                    setModals({ ...modals, login: false });
                    router.push("/(auth)/sign-in");
                }}
            />
        </>
    );
}
