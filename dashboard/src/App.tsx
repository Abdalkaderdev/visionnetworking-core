import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Buildings from "./pages/Buildings";
import Companies from "./pages/Companies";
import Brands from "./pages/Brands";
import Items from "./pages/Items";
import Prices from "./pages/Prices";
import Clients from "./pages/Clients";
import Boqs from "./pages/Boqs";
import Contacts from "./pages/Contacts";
import Quotations from "./pages/Quotations";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/buildings" element={<Buildings />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/items" element={<Items />} />
          <Route path="/prices" element={<Prices />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/boqs" element={<Boqs />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/quotations" element={<Quotations />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
