import React from "react";
import { Modal } from "react-native";
import CustomerHistory from "../AI intelligence tools/CustomerHistory";
import ProfitEngine from "../AI intelligence tools/ProfitEngine";
import VoiceOrder from "../AI intelligence tools/VoiceOrder";
import { LoginRequiredModal } from "../common/LoginRequiredModal";
import DeepSaleView from "../dashboard/DeepSaleView";
import MainInventoryView from "../inventory/MainInventoryView";
import ItemSalesReport from "../item-sales-report/item-sales-report";
import { EditMenuItem } from "../menu/EditMenuItem";
import { TableQrCodes } from "../menu/TableQrCodes";

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
    inventoryMain: boolean;
  };
  setModals: (modals: any) => void;
  data: {
    allBills: any[];
    menus: any[];
    parties: any[];
  };
  onSignIn: () => void;
}

const SidebarModals = ({
  modals,
  setModals,
  data,
  onSignIn,
}: SidebarModalsProps) => {
  return (
    <>
      <LoginRequiredModal
        visible={modals.login}
        onClose={() => setModals((prev: any) => ({ ...prev, login: false }))}
        onSignIn={onSignIn}
      />

      <Modal
        visible={modals.qr}
        animationType="slide"
        onRequestClose={() =>
          setModals((prev: any) => ({ ...prev, qr: false }))
        }
      >
        <TableQrCodes
          onBack={() => setModals((prev: any) => ({ ...prev, qr: false }))}
        />
      </Modal>

      <Modal
        visible={modals.editMenu}
        animationType="slide"
        onRequestClose={() =>
          setModals((prev: any) => ({ ...prev, editMenu: false }))
        }
      >
        <EditMenuItem
          onBack={() =>
            setModals((prev: any) => ({ ...prev, editMenu: false }))
          }
        />
      </Modal>

      <ItemSalesReport
        visible={modals.inventory}
        onBack={() => setModals((prev: any) => ({ ...prev, inventory: false }))}
        onClose={() => setModals((prev: any) => ({ ...prev, inventory: false }))}
      />

      <Modal
        visible={modals.inventoryMain}
        animationType="slide"
        onRequestClose={() =>
          setModals((prev: any) => ({ ...prev, inventoryMain: false }))
        }
      >
        <MainInventoryView
          onBack={() =>
            setModals((prev: any) => ({ ...prev, inventoryMain: false }))
          }
        />
      </Modal>

      <ProfitEngine
        visible={modals.profit}
        onClose={() => setModals((prev: any) => ({ ...prev, profit: false }))}
        bills={data.allBills}
      />

      <VoiceOrder
        visible={modals.voice}
        onClose={() => setModals((prev: any) => ({ ...prev, voice: false }))}
        menus={data.menus}
        onItemMatched={(item: any, qty: number) => {
          alert(
            `Recognized: ${qty} x ${item.name}. Please go to Menu to add to cart.`,
          );
        }}
      />

      <CustomerHistory
        visible={modals.history}
        onClose={() => setModals((prev: any) => ({ ...prev, history: false }))}
        party={null}
        bills={data.allBills}
        allParties={data.parties}
      />

      <Modal
        visible={modals.billHistory}
        animationType="slide"
        onRequestClose={() =>
          setModals((prev: any) => ({ ...prev, billHistory: false }))
        }
      >
        <DeepSaleView
          onBack={() =>
            setModals((prev: any) => ({ ...prev, billHistory: false }))
          }
          isSidebar={true}
          allBills={data.allBills}
        />
      </Modal>
    </>
  );
};

export default SidebarModals;
