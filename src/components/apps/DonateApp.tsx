import React from 'react';
import wechatQr from '../../assets/images/qr_wechat.jpg';
import alipayQr from '../../assets/images/qr_alipay.jpg';

export const DonateApp: React.FC = () => {
  return (
    <div className="h-full w-full bg-[#FFFDF7] p-5 flex flex-col overflow-y-auto cartoon-scroll">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-lg font-black text-[#3A2D28]">给小橘探长加个餐 🐟</h2>
        <p className="text-xs text-[#6E5A52] mt-1 leading-relaxed">
          如果你玩得开心，扫码给作者买杯奶茶吧～
          <br />
          小额随意，心意到了就行！
        </p>
      </div>

      {/* QR Cards */}
      <div className="flex-1 grid grid-cols-2 gap-4">
        {/* 微信 */}
        <div className="rounded-2xl bg-[#A7F3D0] border-[2.5px] border-[#3A2D28] p-3 flex flex-col items-center">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-5 h-5 rounded-md bg-[#07C160] border border-[#3A2D28] flex items-center justify-center text-white text-[10px] font-black">微</div>
            <span className="text-sm font-black text-[#3A2D28]">微信</span>
          </div>
          <div className="w-full aspect-square rounded-xl bg-white border-2 border-[#3A2D28] p-2 overflow-hidden">
            <img
              src={wechatQr}
              alt="微信收款码"
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
          <p className="text-[10px] text-[#6E5A52] mt-2 font-bold">长按图片保存后扫码</p>
        </div>

        {/* 支付宝 */}
        <div className="rounded-2xl bg-[#BFDBFE] border-[2.5px] border-[#3A2D28] p-3 flex flex-col items-center">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-5 h-5 rounded-md bg-[#1677FF] border border-[#3A2D28] flex items-center justify-center text-white text-[10px] font-black">支</div>
            <span className="text-sm font-black text-[#3A2D28]">支付宝</span>
          </div>
          <div className="w-full aspect-square rounded-xl bg-white border-2 border-[#3A2D28] p-2 overflow-hidden">
            <img
              src={alipayQr}
              alt="支付宝收款码"
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
          <p className="text-[10px] text-[#6E5A52] mt-2 font-bold">长按图片保存后扫码</p>
        </div>
      </div>

      {/* Footer note */}
      <div className="mt-4 rounded-xl bg-[#F6EFE2] border-2 border-[#E5D8C5] p-3">
        <p className="text-[11px] text-[#6E5A52] leading-relaxed">
          💡 本作品纯静态网页、不依赖任何后端、也没有植入广告。你支持的每一分钱，
          都会变成下一个案件里的新线索～
        </p>
      </div>
    </div>
  );
};
