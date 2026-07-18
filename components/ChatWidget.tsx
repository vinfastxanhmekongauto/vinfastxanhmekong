'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatSession {
  userId: string;
  conversationId: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>('');

  // Responsive / Keyboard layout states
  const [viewportHeight, setViewportHeight] = useState<string>('100vh');
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Onboarding & Context Injection States
  const [showOnboardingForm, setShowOnboardingForm] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>('');
  const [tempLocation, setTempLocation] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [userLocation, setUserLocation] = useState<string>('');
  const [hasSentFirstApiMessage, setHasSentFirstApiMessage] = useState<boolean>(false);

  // Security Guards States & Refs
  const lastMessageTime = useRef<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize session and chat history on mount
  useEffect(() => {
    // Initialize or retrieve vivi_session_id
    let currentSessionId = localStorage.getItem('vivi_session_id');
    if (!currentSessionId) {
      currentSessionId = crypto.randomUUID();
      localStorage.setItem('vivi_session_id', currentSessionId);
    }
    setSessionId(currentSessionId);

    // Generate or fetch session
    const storedSession = localStorage.getItem('chat_session');
    let session: ChatSession;

    // Load onboarding and tracking states
    const storedHasSent = localStorage.getItem('chat_has_sent_first_api_message');
    if (storedHasSent === 'true') {
      setHasSentFirstApiMessage(true);
    }

    const storedName = localStorage.getItem('user_name') || '';
    const storedLocation = localStorage.getItem('user_location') || '';

    setUserName(storedName);
    setUserLocation(storedLocation);

    if (!storedSession) {
      session = {
        userId: 'user_' + Math.random().toString(36).substring(2, 11),
        conversationId: 'conv_' + Math.random().toString(36).substring(2, 11),
      };
      localStorage.setItem('chat_session', JSON.stringify(session));

      // Force showing the onboarding form
      setUserName('');
      setUserLocation('');
      setShowOnboardingForm(true);
      setMessages([]);

    } else {
      // Session exists, load chat history
      const storedMessages = localStorage.getItem('chat_history');
      if (storedMessages) {
        try {
          const parsed = JSON.parse(storedMessages);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          } else {
            initializeDefaultWelcome();
          }
        } catch (e) {
          initializeDefaultWelcome();
        }
      } else {
        initializeDefaultWelcome();
      }
      setShowOnboardingForm(false);
    }
  }, []);

  const initializeDefaultWelcome = () => {
    const initialMessage: Message = {
      id: Date.now().toString(),
      text: 'Xin chào! Trợ lý ảo VinFast Xanh Mekong đã sẵn sàng. Anh/chị cần hỗ trợ thông tin gì ạ?',
      sender: 'bot',
      timestamp: Date.now(),
    };
    setMessages([initialMessage]);
    localStorage.setItem('chat_history', JSON.stringify([initialMessage]));
  };

  // Persist messages when they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  // Persist onboarding parameters when they change
  useEffect(() => {
    localStorage.setItem('user_name', userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem('user_location', userLocation);
  }, [userLocation]);

  // Scroll to bottom when messages or typing state change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Handle screen resize and visual viewport to fix mobile keyboard layout issues
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    const handleViewportChange = () => {
      if (window.visualViewport) {
        if (window.innerWidth < 768) {
          setViewportHeight(`${window.visualViewport.height}px`);
        } else {
          setViewportHeight('500px'); // Desktop height limit
        }
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
      handleViewportChange();
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
    };
  }, []);

  // Prevent background scroll on mobile when chat is open
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isMobile]);

  // Auto-focus input when chatbot window is opened
  useEffect(() => {
    if (isOpen && !isMobile) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, isMobile]);

  const handleSkipForm = () => {
    setUserName('');
    setUserLocation('');
    localStorage.setItem('user_name', '');
    localStorage.setItem('user_location', '');
    setShowOnboardingForm(false);

    const greetingMessage: Message = {
      id: 'greeting_' + Date.now(),
      text: 'Xin chào! Trợ lý ảo VinFast Xanh Mekong đã sẵn sàng. Anh/chị cần hỗ trợ thông tin gì ạ?',
      sender: 'bot',
      timestamp: Date.now(),
    };

    setMessages([greetingMessage]);
    localStorage.setItem('chat_history', JSON.stringify([greetingMessage]));

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) return;

    const name = tempName.trim();
    const location = tempLocation.trim();

    setUserName(name);
    setUserLocation(location);
    localStorage.setItem('user_name', name);
    localStorage.setItem('user_location', location);
    setShowOnboardingForm(false);

    const greetingMessage: Message = {
      id: 'greeting_' + Date.now(),
      text: `Chào anh/chị ${name}, em là trợ lý ảo VinFast Xanh Mekong. Anh/chị cần hỏi gì ạ?`,
      sender: 'bot',
      timestamp: Date.now(),
    };

    setMessages([greetingMessage]);
    localStorage.setItem('chat_history', JSON.stringify([greetingMessage]));

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Spam / Rate Limit Check (3 seconds debounce)
    const now = Date.now();
    if (now - lastMessageTime.current < 3000) {
      console.warn('[ChatWidget] Rate limit triggered: message sent too fast.');
      return;
    }
    lastMessageTime.current = now;

    if (isTyping || !inputText.trim()) return;

    const userInput = inputText.trim();

    const userMessage: Message = {
      id: 'msg_' + Date.now(),
      text: userInput,
      sender: 'user',
      timestamp: Date.now(),
    };

    // First, append the User's input to the messages array
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    inputRef.current?.focus();

    setIsTyping(true);

    // Behind-the-scenes Context Injection
    let apiMessagePayload = userInput;
    if (!hasSentFirstApiMessage) {
      if (userName.trim() && userLocation.trim()) {
        apiMessagePayload = `Thông tin khách hàng: Tên là ${userName}, ở ${userLocation}. Câu hỏi: ${userInput}`;
      } else {
        apiMessagePayload = `Khách hàng ẩn danh hỏi: ${userInput}`;
      }
      setHasSentFirstApiMessage(true);
      localStorage.setItem('chat_has_sent_first_api_message', 'true');
    }

    // Log the actual payload being sent to the simulated backend API
    console.log("🚀 [DEBUG] Dữ liệu chuẩn bị gửi cho AI:", apiMessagePayload);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: apiMessagePayload,
          sessionId: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Request to chat API returned success = false');
      }
      const botResponseText = data.reply || 'Workflow was started';

      const botResponse: Message = {
        id: 'msg_bot_' + Date.now(),
        text: botResponseText,
        sender: 'bot',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error('Error sending message to webhook:', error);
      const botResponse: Message = {
        id: 'msg_bot_' + Date.now(),
        text: 'Có lỗi xảy ra khi kết nối với trợ lý ảo. Xin vui lòng thử lại sau.',
        sender: 'bot',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes attention-shake {
          0%, 25%, 100% { transform: rotate(0deg); }
          5% { transform: rotate(-12deg) scale(1.05); }
          10% { transform: rotate(12deg) scale(1.05); }
          15% { transform: rotate(-12deg) scale(1.05); }
          20% { transform: rotate(12deg) scale(1.05); }
        }
        .animate-attention {
          animation: attention-shake 4s ease-in-out infinite;
        }
      `}} />

      {/* Floating Action Button (FAB) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 md:bottom-6 left-6 z-[90] shadow-2xl w-14 h-14 md:w-[72px] md:h-[72px] rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer group animate-attention"
          aria-label="Mở cửa sổ chat"
        >
          <Image
            src="/bot-avatar.svg"
            alt="Trợ lý ảo thông minh"
            width={72}
            height={72}
            className="w-full h-full object-contain"
            priority={true}
          />
          <span className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap shadow-lg">
            Trợ lý ảo VinFast Xanh Mekong
            {/* Tooltip Arrow */}
            <span className="absolute top-1/2 -left-1 -translate-y-1/2 border-[6px] border-transparent border-r-gray-800"></span>
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col w-full bg-white border border-gray-100 overflow-hidden transition-all duration-300 md:inset-auto md:left-6 md:bottom-24 md:w-[400px] md:h-[600px] md:rounded-2xl md:shadow-2xl md:animate-scale-up md:origin-bottom-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#327ad7] text-white flex-none w-full">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full bg-[#2862ac]/40 flex items-center justify-center border border-white/20">
                <Bot size={20} className="text-white" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#327ad7]"></span>
              </div>
              <div>
                <h3 className="font-semibold text-sm tracking-tight text-white leading-tight">
                  Trợ lý ảo VinFast Xanh Mekong
                </h3>
                <span className="text-[10px] text-blue-100 flex items-center gap-1 font-medium">
                  Trực tuyến
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors"
              aria-label="Đóng cửa sổ chat"
            >
              <X size={20} />
            </button>
          </div>

          {showOnboardingForm ? (
            /* Onboarding Form UI Overlay */
            <div className="flex-1 w-full p-6 flex flex-col justify-center bg-gray-50/50 overflow-y-auto animate-fade-in">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5 text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-[#327ad7] flex items-center justify-center mx-auto mb-2 border border-[#327ad7]/20">
                    <Bot size={24} />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800 tracking-tight leading-snug">
                    Thông tin tư vấn
                  </h4>
                  <p className="text-xs text-gray-500 leading-normal px-2 font-medium">
                    Để tiện xưng hô và hỗ trợ anh/chị tốt hơn, xin vui lòng cung cấp thông tin cơ bản.
                  </p>
                </div>

                <form onSubmit={handleSubmitForm} className="flex flex-col gap-3.5 mt-2">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="tempName" className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider pl-1">
                      Họ tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="tempName"
                      type="text"
                      required
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      placeholder="Nhập họ và tên..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#327ad7] focus:ring-1 focus:ring-[#327ad7]/30 transition-all text-gray-800 placeholder-gray-400 font-sans"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="tempLocation" className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider pl-1">
                      Tỉnh / Thành phố
                    </label>
                    <input
                      id="tempLocation"
                      type="text"
                      value={tempLocation}
                      onChange={(e) => setTempLocation(e.target.value)}
                      placeholder="Nhập tỉnh thành (VD: Cần Thơ)..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#327ad7] focus:ring-1 focus:ring-[#327ad7]/30 transition-all text-gray-800 placeholder-gray-400 font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#327ad7] hover:bg-[#2862ac] text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] mt-2 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    Bắt đầu Chat
                  </button>
                </form>

                <div className="text-center mt-1">
                  <button
                    type="button"
                    onClick={handleSkipForm}
                    className="text-xs text-gray-400 hover:text-[#327ad7] underline cursor-pointer transition-colors focus:outline-none"
                  >
                    Bỏ qua / Hỏi trực tiếp
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Normal Chat Interface */
            <>
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto w-full relative p-4 bg-gray-50/50 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 max-w-[90%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                      }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${msg.sender === 'user'
                        ? 'bg-blue-100 text-[#327ad7]'
                        : 'bg-[#327ad7] text-white'
                        }`}
                    >
                      {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                    </div>

                    {/* Message Bubble */}
                    <div className={`flex flex-col min-w-0 max-w-full ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`px-4 py-2.5 text-sm shadow-sm leading-relaxed min-w-0 max-w-[90%] overflow-hidden ${msg.sender === 'user'
                          ? 'bg-[#327ad7] text-white rounded-2xl rounded-tr-sm'
                          : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm'
                          }`}
                      >
                        {msg.sender === 'bot' ? (
                          <div className="w-full overflow-hidden text-sm leading-normal break-words [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-2 [&_li]:mb-1 [&_img]:max-w-full [&_img]:h-auto [&_img]:object-contain [&_img]:rounded-lg [&_img]:mt-2 [&_img]:shadow-sm">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                a: ({ node, ...props }) => {
                                  const href = props.href || '';
                                  // Regex to check if the link is an image (matches .jpg, .jpeg, .png, .gif, .webp)
                                  const isImage = href.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i);

                                  if (isImage) {
                                    return (
                                      <img
                                        src={href}
                                        alt="VinFast"
                                        className="w-full h-auto rounded-lg mt-2 shadow-sm object-contain"
                                      />
                                    );
                                  }

                                  // If not an image, render a normal link
                                  return (
                                    <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline break-all">
                                      {props.children}
                                    </a>
                                  );
                                }
                              }}
                            >
                              {msg.text || ''}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          msg.text
                        )}
                      </div>
                      <span
                        className={`text-[9px] text-gray-400 mt-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'
                          }`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex gap-2.5 max-w-[80%] mr-auto items-end">
                    <div className="w-7 h-7 rounded-full bg-[#327ad7] text-white flex-shrink-0 flex items-center justify-center">
                      <Bot size={14} />
                    </div>
                    <div className="px-4 py-3 bg-white border border-gray-100 rounded-2xl rounded-tl-sm shadow-sm flex items-center space-x-1.5 h-9">
                      <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.8s' }}></div>
                      <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.8s' }}></div>
                      <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.8s' }}></div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 pb-safe bg-white border-t border-gray-100 flex items-center gap-2 flex-none w-full"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isTyping) {
                      e.preventDefault();
                      return;
                    }
                  }}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#327ad7] focus:ring-1 focus:ring-[#327ad7]/30 transition-all text-gray-800 placeholder-gray-400"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isTyping}
                  className="w-9 h-9 rounded-full bg-[#327ad7] text-white flex items-center justify-center hover:bg-[#2862ac] active:scale-95 transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:opacity-50 flex-shrink-0"
                  aria-label="Gửi tin nhắn"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
