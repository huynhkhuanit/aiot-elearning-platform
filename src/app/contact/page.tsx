import React from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, Globe } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-[#6366f1] to-[#9333ea] pt-32 pb-40 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/assets/img/grid-pattern.svg')] opacity-10"></div>
        
        {/* Decorative blobs */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
            <span className="text-sm font-medium">Hỗ trợ 24/7</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-[900] mb-6 tracking-tight">
            Liên hệ với chúng tôi
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Hãy để lại tin nhắn hoặc liên hệ trực tiếp qua các kênh dưới đây.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-20 mb-24">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-6">
            {/* Info Card */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 h-full">
              <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center">
                <span className="w-1 h-6 bg-[#6366f1] rounded-full mr-3"></span>
                Thông tin liên hệ
              </h3>
              
              <div className="space-y-8">
                <div className="flex items-start space-x-4 group">
                  <div className="p-3 bg-blue-50 rounded-xl text-[#6366f1] group-hover:bg-[#6366f1] group-hover:text-white transition-all duration-300">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Email</h4>
                    <p className="text-gray-600 text-sm">huynhkhuanit@gmail.com</p>
                    <p className="text-gray-600 text-sm">support@codesenseaiot.com</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 group">
                  <div className="p-3 bg-purple-50 rounded-xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Điện thoại</h4>
                    <p className="text-gray-600 text-sm">1900-xxxx</p>
                    <p className="text-gray-600 text-sm">(+84) 909 123 456</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 group">
                  <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Địa chỉ</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Tòa nhà DHV, Quận 1<br />
                      TP. Hồ Chí Minh, Việt Nam
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-gray-100">
                <h4 className="font-bold text-gray-900 mb-4">Giờ làm việc</h4>
                <div className="flex items-center space-x-3 text-gray-600 text-sm">
                  <Clock className="w-4 h-4 text-[#6366f1]" />
                  <span>Thứ 2 - Thứ 6: 8:00 - 17:00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-8 md:p-10 shadow-xl border border-gray-100">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Gửi tin nhắn</h3>
                <p className="text-gray-500">Điền vào form bên dưới, chúng tôi sẽ phản hồi trong vòng 24h.</p>
              </div>

              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Họ và tên</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#6366f1] focus:ring-4 focus:ring-[#6366f1]/10 outline-none transition-all duration-200"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Email</label>
                    <input 
                      type="email" 
                      className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#6366f1] focus:ring-4 focus:ring-[#6366f1]/10 outline-none transition-all duration-200"
                      placeholder="example@email.com"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Chủ đề</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="text" 
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#6366f1] focus:ring-4 focus:ring-[#6366f1]/10 outline-none transition-all duration-200"
                      placeholder="Bạn cần hỗ trợ gì?"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Nội dung</label>
                  <textarea 
                    rows={6}
                    className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#6366f1] focus:ring-4 focus:ring-[#6366f1]/10 outline-none transition-all duration-200 resize-none"
                    placeholder="Nhập nội dung tin nhắn chi tiết..."
                  ></textarea>
                </div>

                <button 
                  type="button"
                  className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-[#6366f1] to-[#818cf8] hover:from-[#5558e6] hover:to-[#6366f1] text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-[#6366f1]/50 flex items-center justify-center space-x-2 transform hover:-translate-y-0.5"
                >
                  <Send className="w-5 h-5" />
                  <span>Gửi tin nhắn ngay</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* FAQ Preview or Map could go here */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
           {[
             { title: "Hỗ trợ kỹ thuật", desc: "Gặp vấn đề về khóa học?", link: "Gửi yêu cầu" },
             { title: "Hợp tác doanh nghiệp", desc: "Đào tạo nhân sự IT?", link: "Liên hệ ngay" },
             { title: "Trở thành giảng viên", desc: "Chia sẻ kiến thức?", link: "Đăng ký" }
           ].map((item, index) => (
             <div key={index} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
               <h4 className="font-bold text-gray-900 mb-2 group-hover:text-[#6366f1] transition-colors">{item.title}</h4>
               <p className="text-gray-500 text-sm mb-4">{item.desc}</p>
               <span className="text-[#6366f1] text-sm font-semibold flex items-center">
                 {item.link} <Globe className="w-4 h-4 ml-1" />
               </span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
