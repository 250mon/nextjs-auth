'use client';

import { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function HamburgerMenu({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-30 md:hidden"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <XMarkIcon className="h-8 w-8 text-white" />
        ) : (
          <Bars3Icon className="h-8 w-8 text-gray-800" />
        )}
      </button>
      <div
        className={`fixed top-16 right-4 w-56 bg-white rounded-md shadow-lg z-20 transform transition-transform ease-in-out duration-200 md:relative md:top-0 md:right-0 md:w-full md:transform-none md:bg-transparent md:shadow-none ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        } md:opacity-100 md:scale-100`}
        style={{ transformOrigin: 'top right' }}
      >
        {/* Mobile dropdown content */}
        {isOpen && (
          <div className="md:hidden p-2">
            {children}
          </div>
        )}
        {/* Desktop sidebar content */}
        <div className="hidden md:block">
          {children}
        </div>
      </div>
    </>
  );
}
