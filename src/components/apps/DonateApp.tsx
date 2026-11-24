import React from 'react';
import wechatQr from '../../assets/images/qr_wechat.jpg';
import alipayQr from '../../assets/images/qr_alipay.jpg';

export const DonateApp: React.FC = () => {
  return (
    <div className="h-full w-full bg-[#FFFDF7] p-5 flex items-center justify-center">
      <div className="w-full grid grid-cols-2 gap-4">
        {/* 微信 */}
        <div className="rounded-2xl bg-[#A7F3D0] border-[2.5px] border-[#3A2D28] p-3 flex flex-col items-center">
          <div className="w-full aspect-square rounded-xl bg-white border-2 border-[#3A2D28] p-2 overflow-hidden">
            <img
              src={wechatQr}
              alt=""
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
        </div>

        {/* 支付宝 */}
        <div className="rounded-2xl bg-[#BFDBFE] border-[2.5px] border-[#3A2D28] p-3 flex flex-col items-center">
          <div className="w-full aspect-square rounded-xl bg-white border-2 border-[#3A2D28] p-2 overflow-hidden">
            <img
              src={alipayQr}
              alt=""
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
