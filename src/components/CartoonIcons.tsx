import React from 'react';
import { AppId, FSNode } from '../os/types';

interface IconProps {
  className?: string;
}

export const PawEmblem: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
    <ellipse cx="16" cy="20" rx="7.5" ry="6" fill="#FF9F1C" stroke="#3A2D28" strokeWidth="2.2" />
    <circle cx="8" cy="12" r="3" fill="#FF9F1C" stroke="#3A2D28" strokeWidth="2" />
    <circle cx="13.5" cy="8.5" r="3" fill="#FF9F1C" stroke="#3A2D28" strokeWidth="2" />
    <circle cx="19.5" cy="8.5" r="3" fill="#FF9F1C" stroke="#3A2D28" strokeWidth="2" />
    <circle cx="24.5" cy="12.5" r="2.8" fill="#FF9F1C" stroke="#3A2D28" strokeWidth="2" />
    <ellipse cx="16" cy="20.5" rx="3.2" ry="2.2" fill="#FFE4E9" />
  </svg>
);

export const AppIcon: React.FC<{ appId: AppId; className?: string }> = ({
  appId,
  className = 'w-9 h-9',
}) => {
  switch (appId) {
    case 'explorer':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <path
            d="M6 14C6 11.8 7.8 10 10 10H19L22.5 14H38C40.2 14 42 15.8 42 18V36C42 38.2 40.2 40 38 40H10C7.8 40 6 38.2 6 36V14Z"
            fill="#FFD166"
            stroke="#3A2D28"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <rect
            x="9"
            y="18"
            width="30"
            height="19"
            rx="3"
            fill="#FFE29A"
            stroke="#3A2D28"
            strokeWidth="2.2"
          />
          <circle cx="24" cy="27.5" r="5" fill="#60A5FA" stroke="#3A2D28" strokeWidth="2" />
          <path d="M27.8 31.3L31.5 35" stroke="#3A2D28" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 'notepad':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <rect
            x="9"
            y="8"
            width="30"
            height="34"
            rx="5"
            fill="#FFFDF7"
            stroke="#3A2D28"
            strokeWidth="2.5"
          />
          <rect
            x="9"
            y="8"
            width="30"
            height="9"
            rx="4"
            fill="#FDE68A"
            stroke="#3A2D28"
            strokeWidth="2.5"
          />
          <path d="M16 6V11M24 6V11M32 6V11" stroke="#3A2D28" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M15 23H33M15 29H30M15 35H25" stroke="#6E5A52" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'photos':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <rect
            x="6"
            y="10"
            width="36"
            height="29"
            rx="5"
            fill="#BAE6FD"
            stroke="#3A2D28"
            strokeWidth="2.5"
          />
          <circle cx="16" cy="19" r="3.5" fill="#FBBF24" stroke="#3A2D28" strokeWidth="2" />
          <path
            d="M8 35L17 25L24 32L31 23L40 35H8Z"
            fill="#6EE7B7"
            stroke="#3A2D28"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'mail':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <rect
            x="6"
            y="12"
            width="36"
            height="25"
            rx="5"
            fill="#FFE4E9"
            stroke="#3A2D28"
            strokeWidth="2.5"
          />
          <path
            d="M7 14L24 27L41 14"
            stroke="#3A2D28"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="24" cy="26" r="3.5" fill="#FF758F" stroke="#3A2D28" strokeWidth="2" />
        </svg>
      );
    case 'chat':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <path
            d="M8 14C8 10.7 10.7 8 14 8H34C37.3 8 40 10.7 40 14V28C40 31.3 37.3 34 34 34H20L12 40V34H14C10.7 34 8 31.3 8 28V14Z"
            fill="#A7F3D0"
            stroke="#3A2D28"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="17.5" cy="21" r="2.2" fill="#3A2D28" />
          <circle cx="24" cy="21" r="2.2" fill="#3A2D28" />
          <circle cx="30.5" cy="21" r="2.2" fill="#3A2D28" />
        </svg>
      );
    case 'music':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <rect
            x="8"
            y="8"
            width="32"
            height="32"
            rx="8"
            fill="#DDD6FE"
            stroke="#3A2D28"
            strokeWidth="2.5"
          />
          <circle cx="20" cy="31" r="4.5" fill="#A78BFA" stroke="#3A2D28" strokeWidth="2.2" />
          <circle cx="31" cy="28" r="4.5" fill="#A78BFA" stroke="#3A2D28" strokeWidth="2.2" />
          <path
            d="M24.5 31V16L35.5 14V28"
            stroke="#3A2D28"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'clueboard':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <rect
            x="8"
            y="9"
            width="32"
            height="32"
            rx="5"
            fill="#FED7AA"
            stroke="#3A2D28"
            strokeWidth="2.5"
          />
          <circle cx="22" cy="23" r="7" fill="#FFFDF7" stroke="#3A2D28" strokeWidth="2.5" />
          <path d="M27.2 28.2L34 35" stroke="#3A2D28" strokeWidth="3" strokeLinecap="round" />
          <circle cx="24" cy="9" r="3" fill="#FF758F" stroke="#3A2D28" strokeWidth="2" />
        </svg>
      );
    case 'achievements':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <path
            d="M16 8H32V19C32 25.6 28.4 29 24 29C19.6 29 16 25.6 16 19V8Z"
            fill="#FDE68A"
            stroke="#3A2D28"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M16 11H10V15C10 19.4 12.4 22 16 22"
            stroke="#3A2D28"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M32 11H38V15C38 19.4 35.6 22 32 22"
            stroke="#3A2D28"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M24 29V35" stroke="#3A2D28" strokeWidth="2.5" />
          <rect
            x="18"
            y="35"
            width="12"
            height="5"
            rx="1.5"
            fill="#FFB830"
            stroke="#3A2D28"
            strokeWidth="2"
          />
          <rect
            x="14"
            y="40"
            width="20"
            height="4"
            rx="2"
            fill="#92400E"
            stroke="#3A2D28"
            strokeWidth="2"
          />
          <path d="M24 15L25.6 18.5L29.5 19L26.6 21.7L27.4 25.5L24 23.6L20.6 25.5L21.4 21.7L18.5 19L22.4 18.5L24 15Z" fill="#FFFDF7" stroke="#3A2D28" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      );
    case 'browser':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <rect
            x="6"
            y="10"
            width="36"
            height="28"
            rx="5"
            fill="#BFDBFE"
            stroke="#3A2D28"
            strokeWidth="2.5"
          />
          <path d="M6 18H42" stroke="#3A2D28" strokeWidth="2.5" />
          <circle cx="11" cy="14" r="1.5" fill="#3A2D28" />
          <circle cx="16" cy="14" r="1.5" fill="#3A2D28" />
          <circle cx="21" cy="14" r="1.5" fill="#3A2D28" />
          <path d="M12 26L18 22L24 26V32H12V26Z" fill="#FDE68A" stroke="#3A2D28" strokeWidth="2" />
        </svg>
      );
    case 'pet':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <circle cx="24" cy="24" r="18" fill="#FEE2E2" stroke="#3A2D28" strokeWidth="2.5" />
          <path d="M14 16L18 10L22 16" fill="#FEE2E2" stroke="#3A2D28" strokeWidth="2" strokeLinejoin="round" />
          <path d="M34 16L30 10L26 16" fill="#FEE2E2" stroke="#3A2D28" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="18" cy="22" r="2.5" fill="#3A2D28" />
          <circle cx="30" cy="22" r="2.5" fill="#3A2D28" />
          <path d="M21 28C22.5 30 25.5 30 27 28" stroke="#3A2D28" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'timeline':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <rect
            x="5"
            y="9"
            width="38"
            height="30"
            rx="5"
            fill="#EEF2FF"
            stroke="#3A2D28"
            strokeWidth="2.5"
          />
          <path d="M10 30H38" stroke="#3A2D28" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M14 30V26M21 30V26M28 30V26M35 30V26" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
          <rect x="11" y="16" width="10" height="5" rx="2" fill="#C7D2FE" stroke="#3A2D28" strokeWidth="1.8" />
          <rect x="23" y="20" width="12" height="5" rx="2" fill="#A7F3D0" stroke="#3A2D28" strokeWidth="1.8" />
          <circle cx="21" cy="18.5" r="1.6" fill="#DC2626" />
        </svg>
      );
    case 'radio':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <rect x="6" y="14" width="36" height="26" rx="5" fill="#D6B48A" stroke="#3A2D28" strokeWidth="2.5" />
          <path d="M14 22H26M14 26H26M14 30H26M14 34H26" stroke="#8B6B4A" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="34" cy="25" r="4" fill="#FBCFE8" stroke="#3A2D28" strokeWidth="2" />
          <circle cx="34" cy="34" r="3.2" fill="#FFFDF7" stroke="#3A2D28" strokeWidth="2" />
          <path d="M14 14L22 6" stroke="#3A2D28" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="22" cy="6" r="2" fill="#FFB830" stroke="#3A2D28" strokeWidth="1.8" />
        </svg>
      );
    case 'relations':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <rect x="5" y="6" width="38" height="36" rx="4" fill="#E8D5B7" stroke="#3A2D28" strokeWidth="2.5" />
          <path d="M5 11H43" stroke="#3A2D28" strokeWidth="2" />
          <rect x="11" y="15" width="9" height="11" rx="2" fill="#D9F99D" stroke="#3A2D28" strokeWidth="1.8" />
          <rect x="28" y="18" width="9" height="11" rx="2" fill="#BFDBFE" stroke="#3A2D28" strokeWidth="1.8" />
          <rect x="19" y="30" width="10" height="9" rx="2" fill="#FFE4E9" stroke="#3A2D28" strokeWidth="1.8" />
          <path d="M20 21C24 24 26 26 26 30" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M37 23C34 27 31 29 28 30" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="15.5" cy="15.5" r="1.6" fill="#DC2626" />
          <circle cx="32.5" cy="18.5" r="1.6" fill="#DC2626" />
        </svg>
      );
    case 'archive':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <rect x="8" y="6" width="32" height="36" rx="4" fill="#CFFAFE" stroke="#3A2D28" strokeWidth="2.5" />
          <rect x="11" y="10" width="26" height="9" rx="2" fill="#FFFDF7" stroke="#3A2D28" strokeWidth="2" />
          <rect x="11" y="21" width="26" height="9" rx="2" fill="#FFFDF7" stroke="#3A2D28" strokeWidth="2" />
          <rect x="11" y="32" width="26" height="7" rx="2" fill="#FFFDF7" stroke="#3A2D28" strokeWidth="2" />
          <path d="M20 14.5H28M20 25.5H28M20 35.5H28" stroke="#0E7490" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'filing':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <path d="M6 15C6 13.3 7.3 12 9 12H20L24 16H39C40.7 16 42 17.3 42 19V37C42 38.7 40.7 40 39 40H9C7.3 40 6 38.7 6 37V15Z" fill="#FDE68A" stroke="#3A2D28" strokeWidth="2.5" />
          <rect x="14" y="22" width="14" height="11" rx="2" fill="#FFFDF7" stroke="#3A2D28" strokeWidth="2" />
          <circle cx="19" cy="26" r="1.6" fill="#3A2D28" />
          <path d="M14 31L20 27L24 30L28 28V33H14V31Z" fill="#C7D2FE" stroke="#3A2D28" strokeWidth="1.2" />
          <path d="M32 24H38M32 29H38M32 34H38" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
  }
};

export const TrashIcon: React.FC<{ hasItems?: boolean; className?: string }> = ({
  hasItems = true,
  className = 'w-9 h-9',
}) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <path
      d="M12 15H36L34 39C33.8 40.7 32.4 42 30.7 42H17.3C15.6 42 14.2 40.7 14 39L12 15Z"
      fill="#E2E8F0"
      stroke="#3A2D28"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <path d="M9 15H39" stroke="#3A2D28" strokeWidth="2.5" strokeLinecap="round" />
    <path
      d="M19 15V11C19 9.9 19.9 9 21 9H27C28.1 9 29 9.9 29 11V15"
      stroke="#3A2D28"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {hasItems ? (
      <path
        d="M18 15L20 10L26 12L29 9L31 15"
        fill="#FFFDF7"
        stroke="#3A2D28"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    ) : null}
    <path d="M20 22V35M24 22V35M28 22V35" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

export const FileNodeIcon: React.FC<{ node: FSNode; className?: string }> = ({
  node,
  className = 'w-10 h-10',
}) => {
  if (node.type === 'folder') {
    if (node.id === 'folder_trash') {
      return <TrashIcon className={className} />;
    }
    return (
      <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
        <path
          d="M6 14C6 11.8 7.8 10 10 10H19L22.5 14H38C40.2 14 42 15.8 42 18V36C42 38.2 40.2 40 38 40H10C7.8 40 6 38.2 6 36V14Z"
          fill="#FFD166"
          stroke="#3A2D28"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <rect
          x="9"
          y="18"
          width="30"
          height="19"
          rx="3"
          fill="#FFE8A3"
          stroke="#3A2D28"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (node.type === 'image') {
    return <AppIcon appId="photos" className={className} />;
  }

  if (node.locked) {
    return (
      <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
        <rect
          x="10"
          y="8"
          width="28"
          height="33"
          rx="5"
          fill="#FEE2E2"
          stroke="#3A2D28"
          strokeWidth="2.5"
        />
        <path
          d="M19 22V19C19 16.2 21.2 14 24 14C26.8 14 29 16.2 29 19V22"
          stroke="#3A2D28"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <rect
          x="16"
          y="22"
          width="16"
          height="12"
          rx="3"
          fill="#FBBF24"
          stroke="#3A2D28"
          strokeWidth="2.2"
        />
        <circle cx="24" cy="28" r="1.8" fill="#3A2D28" />
      </svg>
    );
  }

  return <AppIcon appId="notepad" className={className} />;
};
