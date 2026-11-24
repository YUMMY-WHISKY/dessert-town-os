import React from 'react';
import wechatQr from '../../assets/images/qr_wechat.jpg';
import alipayQr from '../../assets/images/qr_alipay.jpg';

export const DonateApp: React.FC = () => {
  return (
    <div className="h-full w-full bg-[#FFFDF7] p-5 flex flex-col">
      {/* 提示 */}
      <div className="text-center mb-4">
        <p className="text-xs text-[#6E5A52] leading-relaxed">
          如果你玩得开心，给作者买杯奶茶吧～
          <br />
          小额随意，心意到了就行！
        </p>
      </div>

      {/* QR Cards - 撑满剩余空间，两列平分 */}
      <div className="flex-1 grid grid-cols-2 gap-4">
        {/* 微信 */}
        <div className="rounded-2xl bg-[#A7F3D0] border-[2.5px] border-[#3A2D28] p-3 flex flex-col items-center">
          <div className="flex-1 w-full rounded-xl bg-white border-2 border-[#3A2D28] p-2 overflow-hidden flex items-center justify-center">
            <img
              src={wechatQr}
              alt="微信收款码"
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
          <span className="mt-2 text-sm font-black text-[#07C160]">微信</span>
        </div>

        {/* 支付宝 */}
        <div className="rounded-2xl bg-[#BFDBFE] border-[2.5px] border-[#3A2D28] p-3 flex flex-col items-center">
          <div className="flex-1 w-full rounded-xl bg-white border-2 border-[#3A2D28] p-2 overflow-hidden flex items-center justify-center">
            <img
              src={alipayQr}
              alt="支付宝收款码"
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
          <span className="mt-2 text-sm font-black text-[#1677FF]">支付宝</span>
        </div>
      </div>
    </div>
  );
};
