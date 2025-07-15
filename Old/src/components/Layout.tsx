
import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-grow container mx-auto py-6 px-4 bg-white text-argumentum-text">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
