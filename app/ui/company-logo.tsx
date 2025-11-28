import { lusitana } from '@/app/ui/fonts';
import Image from 'next/image';
import { getImageSrc } from '@/app/lib/utils';

export default function CompanyLogo() {
  return (
    <div
      className={`${lusitana.className} flex flex-row items-center leading-none text-white`}
    >
      <Image 
        src={getImageSrc("/danaul-logo-blue-sm.png")} 
        alt="Danaul Logo" 
        width={48} 
        height={48} 
        className="mr-3" 
      />
      <p className="text-[24px]">Danaul Authentication</p>
    </div>
  );
}
