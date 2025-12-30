import React from 'react';
import Logo from '../../assets/Logo.png';

function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8 mt-3">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        {/* Logo and Address */}
        <div className="flex items-center mb-6 md:mb-0">
          <img src={Logo} alt="SAN Engineering Solutions" className="w-16 h-16 mr-4" />
          <div className="text-sm leading-relaxed">
            <h3 className="text-lg font-bold">SAN ENGINEERING SOLUTIONS</h3>
            <p>
              No. 29/3, KUBERALAKSHMI TOWERS, 3rd FLOOR,<br />
              OPP TO POST OFFICE, BUNGALOW STREET,<br />
              PERUNDURAI – 638 052, ERODE DIST., TAMILNADU
            </p>
          </div>
        </div>
        {/* Quick Links */}
        <div>
          <h4 className="text-lg font-semibold mb-2">Quick Links</h4>
          <ul className="space-y-1">
            <li>
              <a href="/" className="hover:text-gray-400 transition-colors text-sm">
                Home
              </a>
            </li>
            <li>
              <a href="/payroll" className="hover:text-gray-400 transition-colors text-sm">
                Payroll
              </a>
            </li>
          </ul>
        </div>
      </div>
      {/* Copyright */}
      <div className="mt-6 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} SAN Engineering Solutions. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;