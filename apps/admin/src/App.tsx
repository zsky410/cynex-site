import { Admin, Resource } from "react-admin";
import InventoryIcon from "@mui/icons-material/Inventory";
import LayersIcon from "@mui/icons-material/Layers";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PeopleIcon from "@mui/icons-material/People";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import { dataProvider } from "./dataProvider";
import { authProvider } from "./authProvider";
import { ProductList, ProductEdit, ProductCreate } from "./resources/products";
import { VariantList, VariantEdit, VariantCreate } from "./resources/variants";
import { OrderList, OrderShow } from "./resources/orders";
import { UserList, UserShow, UserEdit } from "./resources/users";
import { SourceList, SourceEdit, SourceCreate } from "./resources/sources";
import { SourceOrderList, SourceOrderEdit, SourceOrderCreate } from "./resources/sourceOrders";
import { AccountList, AccountEdit, AccountCreate, KeyList, KeyEdit, KeyCreate } from "./resources/inventory";

export default function App() {
  return (
    <Admin dataProvider={dataProvider} authProvider={authProvider} title="Cynex Admin">
      <Resource
        name="products"
        list={ProductList}
        edit={ProductEdit}
        create={ProductCreate}
        icon={InventoryIcon}
      />
      <Resource
        name="product-variants"
        options={{ label: "Variants" }}
        list={VariantList}
        edit={VariantEdit}
        create={VariantCreate}
        icon={LayersIcon}
      />
      <Resource name="orders" list={OrderList} show={OrderShow} icon={ReceiptIcon} />
      <Resource name="users" list={UserList} show={UserShow} edit={UserEdit} icon={PeopleIcon} />
      <Resource
        name="supply-sources"
        options={{ label: "Sources" }}
        list={SourceList}
        edit={SourceEdit}
        create={SourceCreate}
        icon={StorefrontIcon}
      />
      <Resource
        name="source-orders"
        options={{ label: "Source orders" }}
        list={SourceOrderList}
        edit={SourceOrderEdit}
        create={SourceOrderCreate}
        icon={ShoppingCartIcon}
      />
      <Resource
        name="inventory-accounts"
        options={{ label: "Inventory: accounts" }}
        list={AccountList}
        edit={AccountEdit}
        create={AccountCreate}
        icon={AccountBoxIcon}
      />
      <Resource
        name="inventory-keys"
        options={{ label: "Inventory: keys" }}
        list={KeyList}
        edit={KeyEdit}
        create={KeyCreate}
        icon={VpnKeyIcon}
      />
    </Admin>
  );
}
