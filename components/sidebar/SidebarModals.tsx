import React from 'react';
import { Modal } from 'react-native';
import { TableQrCodes } from "../menu/TableQrCodes";
import { EditMenuItem } from "../menu/EditMenuItem";
import ItemSalesReport from "../item-sales-report/item-sales-report";
import ProfitEngine from "../AI intelligence tools/ProfitEngine";
import VoiceOrder from "../AI intelligence tools/VoiceOrder";
import CustomerHistory from "../AI intelligence tools/CustomerHistory";
import { LoginRequiredModal } from "../common/LoginRequiredModal";
import DeepSaleView from "../dashboard/DeepSaleView";

interface SidebarModalsProps {
    modals: {
        login: boolean;
        qr: boolean;
        editMenu: boolean;
        inventory: boolean;
        profit: boolean;
        voice: boolean;
        history: boolean;
        billHistory: boolean;
    };
    setModals: (modals: any) => void;
    data: {
        allBills: any[];
        menus: any[];
        parties: any[];
    };
    onSignIn: () => void;
}

const SidebarModals = ({ modals, setModals, data, onSignIn }: SidebarModalsProps) => {
    return (
        <>
            <LoginRequiredModal
                visible={modals.login}
                onClose={() => setModals({ ...modals, login: false })}
                onSignIn={onSignIn}
            />

            <Modal visible={modals.qr} animationType="slide" onRequestClose={() => setModals({ ...modals, qr: false })}>
                <TableQrCodes onBack={() => setModals({ ...modals, qr: false })} />
            </Modal>

            <Modal visible={modals.editMenu} animationType="slide" onRequestClose={() => setModals({ ...modals, editMenu: false })}>
                <EditMenuItem onBack={() => setModals({ ...modals, editMenu: false })} />
            </Modal>

            <Modal visible={modals.inventory} animationType="slide" onRequestClose={() => setModals({ ...modals, inventory: false })}>
                <ItemSalesReport onBack={() => setModals({ ...modals, inventory: false })} />
            </Modal>

            <ProfitEngine
                visible={modals.profit}
                onClose={() => setModals({ ...modals, profit: false })}
                bills={data.allBills}
            />

            <VoiceOrder
                visible={modals.voice}
                onClose={() => setModals({ ...modals, voice: false })}
                menus={data.menus}
                onItemMatched={(item: any, qty: number) => {
                    alert(`Recognized: ${qty} x ${item.name}. Please go to Menu to add to cart.`);
                }}
            />

            <CustomerHistory
                visible={modals.history}
                onClose={() => setModals({ ...modals, history: false })}
                party={null}
                bills={data.allBills}
                allParties={data.parties}
            />

            <Modal visible={modals.billHistory} animationType="slide" onRequestClose={() => setModals({ ...modals, billHistory: false })}>
                <DeepSaleView onBack={() => setModals({ ...modals, billHistory: false })} isSidebar={true} />
            </Modal>
        </>
    );
};

export default SidebarModals;
