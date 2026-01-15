import React from 'react';
import { CheckCircle, Users, Trophy, Target, Code, Rocket, Heart, Globe } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#6366f1] to-[#9333ea] text-white pt-32 pb-20">
        <div className="absolute inset-0 bg-[url('/assets/img/grid-pattern.svg')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
              <span className="text-sm font-medium">Hành trình kiến tạo tương lai</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-[900] mb-8 leading-tight tracking-tight">
              Nâng tầm kỹ năng <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">
                Lập trình của bạn
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 leading-relaxed max-w-2xl mx-auto mb-10">
              CodeSense AIoT không chỉ là nơi học tập, mà là cộng đồng những người đam mê công nghệ, cùng nhau chinh phục những đỉnh cao mới.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/roadmap" 
                className="px-8 py-4 bg-white text-[#6366f1] font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Khám phá lộ trình
              </Link>
              <Link 
                href="/contact" 
                className="px-8 py-4 bg-[#6366f1]/20 backdrop-blur-sm border border-white/30 text-white font-bold rounded-xl hover:bg-[#6366f1]/30 transition-all"
              >
                Liên hệ tư vấn
              </Link>
            </div>
          </div>
        </div>
        
        {/* Decorative shapes */}
        <div className="absolute top-1/2 left-10 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/2 right-10 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      {/* Stats Section - Floating Cards */}
      <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20 mb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Học viên", value: "10K+", icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "Khóa học", value: "5+", icon: Code, color: "text-purple-500", bg: "bg-purple-50" },
            { label: "Giảng viên", value: "20+", icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-50" },
            { label: "Đánh giá", value: "4.9", icon: Heart, color: "text-red-500", bg: "bg-red-50" }
          ].map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="text-3xl font-[900] text-gray-900 mb-1">{stat.value}</div>
              <div className="text-gray-500 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-7xl mx-auto px-6 mb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center space-x-2 text-[#6366f1] font-bold uppercase tracking-wider text-sm">
              <Target className="w-5 h-5" />
              <span>Sứ mệnh & Tầm nhìn</span>
            </div>
            <h2 className="text-4xl font-[900] text-gray-900 leading-tight">
              Kiến tạo nền tảng <br/>
              <span className="text-[#6366f1]">Giáo dục công nghệ</span> hàng đầu
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Tại CodeSense AIoT, chúng tôi tin rằng mọi người đều có khả năng trở thành một lập trình viên xuất sắc nếu được hướng dẫn đúng cách. Sứ mệnh của chúng tôi là xóa bỏ rào cản trong việc tiếp cận kiến thức công nghệ.
            </p>
            
            <div className="space-y-4">
              {[
                { title: "Chất lượng hàng đầu", desc: "Nội dung được biên soạn bởi các chuyên gia Senior." },
                { title: "Học tập thực chiến", desc: "Làm dự án thực tế, không chỉ học lý thuyết suông." },
                { title: "Cộng đồng hỗ trợ", desc: "Luôn có người đồng hành cùng bạn 24/7." }
              ].map((item, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="p-2 bg-[#6366f1]/10 text-[#6366f1] rounded-lg mt-1">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">{item.title}</h4>
                    <p className="text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#6366f1] to-[#9333ea] rounded-3xl transform rotate-3 opacity-20 blur-lg"></div>
            <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden aspect-square flex items-center justify-center p-8">
               {/* Abstract illustration placeholder */}
               <div className="text-center">
                  <div className="w-32 h-32 bg-[#6366f1]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Rocket className="w-16 h-16 text-[#6366f1]" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to Launch?</h3>
                  <p className="text-gray-500">Bắt đầu hành trình của bạn ngay hôm nay</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-gray-50 py-24 mb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-[900] text-gray-900 mb-6">Giá trị cốt lõi</h2>
            <p className="text-lg text-gray-600">
              Những nguyên tắc định hình văn hóa và cách chúng tôi làm việc tại CodeSense AIoT.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Tận tâm", desc: "Đặt lợi ích của học viên lên hàng đầu.", icon: Heart },
              { title: "Sáng tạo", desc: "Không ngừng đổi mới phương pháp giảng dạy.", icon: Globe },
              { title: "Chuyên nghiệp", desc: "Cam kết chất lượng trong từng bài giảng.", icon: Trophy }
            ].map((item, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#6366f1] transition-colors duration-300">
                  <item.icon className="w-7 h-7 text-gray-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 mb-24">
        <div className="bg-[#1a1a1a] rounded-3xl p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
             <div className="absolute -top-[50%] -left-[20%] w-[80%] h-[200%] bg-[#6366f1] opacity-10 rotate-12 blur-3xl"></div>
             <div className="absolute -bottom-[50%] -right-[20%] w-[80%] h-[200%] bg-[#9333ea] opacity-10 -rotate-12 blur-3xl"></div>
          </div>
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-[900] text-white mb-6">
              Sẵn sàng bắt đầu hành trình?
            </h2>
            <p className="text-gray-400 text-lg mb-10">
              Tham gia cùng hàng ngàn học viên khác và bắt đầu sự nghiệp lập trình của bạn ngay hôm nay.
            </p>
            <Link 
              href="/roadmap" 
              className="inline-flex items-center justify-center px-8 py-4 bg-[#6366f1] text-white font-bold rounded-xl hover:bg-[#5558e6] transition-all shadow-lg hover:shadow-[#6366f1]/50"
            >
              Xem lộ trình học
              <Rocket className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
