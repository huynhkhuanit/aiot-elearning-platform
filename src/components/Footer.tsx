"use client";

import { Mail, Phone, MapPin, Facebook, Twitter, Youtube, Github, Volume2 } from "lucide-react";
import Link from "next/link";

const footerLinks = {
  tools: [
    { name: "Tạo CV xin việc", href: "#" },
    { name: "Rút gọn liên kết", href: "#" },
    { name: "Clip-path maker", href: "#" },
    { name: "Snippet generator", href: "#" },
    { name: "CSS Grid generator", href: "#" },
    { name: "Cảnh báo sờ tay lên mặt", href: "#" },
  ],
  community: [
    { name: "Discord", href: "https://discord.com/invite/a6pe69KkPd" },
    { name: "Facebook Group", href: "#" },
    { name: "Telegram", href: "#" },
    { name: "Youtube", href: "#" },
  ]
};

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Youtube, href: "#", label: "Youtube" },
  { icon: Github, href: "https://github.com/huynhkhuanit", label: "Github" },
];

export default function Footer() {
  return (
    <footer 
      className="bg-gray-900 text-white pointer-events-none"
      style={{
        position: 'relative',
        zIndex: 30,
      }}
    >
      <div className="w-full px-6 md:px-12 py-12 pointer-events-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Link 
                href="/" 
                className="flex items-center justify-center cursor-pointer"
                style={{ transition: 'all .2s ease' }}
              >
                <img
                  src="/assets/img/logo.png" 
                  alt="DHV LearnX Logo" 
                  width={38}
                  height={38}
                  style={{ objectFit: 'contain' }}
                  className="w-[38px] h-[38px] rounded-lg"
                />
              </Link>
              <div className="hidden sm:block">
                <Link 
                  href="/" 
                  className="hover:opacity-80"
                  style={{ transition: 'all .2s ease' }}
                >
                  <p className="text-small font-[700] text-white">Học lập trình thông minh với AI & IoT</p>
                </Link>
              </div>
            </div>
            
            <p className="text-gray-400 text-sm leading-relaxed">
              Nền tảng học lập trình hàng đầu Việt Nam.
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span>huynhkhuanit@gmail.com</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                <span>1900-xxxx</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Hồ Chí Minh, Việt Nam</span>
              </div>
            </div>
          </div>

          {/* About DHV LearnX */}
          <div>
            <h4 className="font-semibold text-base mb-4 text-white">Về DHV LearnX</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/about" 
                  className="text-gray-400 hover:text-white inline-block hover:translate-x-[4px]"
                  style={{ transition: 'all .2s ease' }}
                >
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-gray-400 hover:text-white inline-block hover:translate-x-[4px]"
                  style={{ transition: 'all .2s ease' }}
                >
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Công cụ */}
          <div>
            <h4 className="font-semibold text-base mb-4 text-white">Công cụ</h4>
            <ul className="space-y-2">
              {footerLinks.tools.map((link, index) => (
                <li key={index}>
                  <Link 
                    href={link.href} 
                    className="text-gray-400 hover:text-white inline-block hover:translate-x-[4px]"
                    style={{ transition: 'all .2s ease' }}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-semibold text-base mb-4 text-white">Cộng đồng</h4>
            <ul className="space-y-2 mb-4">
              {footerLinks.community.map((link, index) => (
                <li key={index}>
                  <Link 
                    href={link.href} 
                    className="text-gray-400 hover:text-white inline-block hover:translate-x-[4px]"
                    style={{ transition: 'all .2s ease' }}
                    {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
            
            {/* Social Links */}
            <div className="flex space-x-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  {...(social.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700"
                  style={{ transition: 'all .2s ease' }}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Empty Column 5 */}
          <div></div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between pointer-events-auto">
          <div className="flex items-center space-x-2 text-gray-400 text-xs mb-3 md:mb-0">
            <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center">
              <Volume2 className="w-3 h-3" />
            </div>
            <span>© 2025 DHV LearnX. All rights reserved.</span>
          </div>
          
          <div className="flex space-x-4 text-xs">
            <Link 
              href="#" 
              className="text-gray-400 hover:text-white inline-block hover:translate-x-[4px]"
              style={{ transition: 'all .2s ease' }}
            >
              Điều khoản sử dụng
            </Link>
            <Link 
              href="#" 
              className="text-gray-400 hover:text-white inline-block hover:translate-x-[4px]"
              style={{ transition: 'all .2s ease' }}
            >
              Chính sách bảo mật
            </Link>
            <Link 
              href="/contact" 
              className="text-gray-400 hover:text-white inline-block hover:translate-x-[4px]"
              style={{ transition: 'all .2s ease' }}
            >
              Liên hệ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}