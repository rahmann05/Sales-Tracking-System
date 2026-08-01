import React from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Home } from './pages/Home';

export default function App() {
  return (
    <>
      <Header />
      <main className="container" style={{ flex: 1 }}>
        <Home />
      </main>
      <Footer />
    </>
  );
}
