import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, X, Send, User, Bot, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

const ChatbotWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const role = user?.role || 'volunteer';

  const ROLE_CONTEXT = {
    volunteer: {
      systemPrompt: `You are a helpful assistant for the VolunteerMS platform.
      You are talking to a VOLUNTEER user.
      You can ONLY help with:
      - Viewing and updating their own profile
      - Browsing and searching volunteer opportunities
      - Applying for opportunities and checking application status
      - Registering for events and viewing their event schedule
      - Viewing their attendance history and volunteer hours
      - Updating their skills, interests, and availability
      
      You must REFUSE to help with or discuss:
      - Admin tasks (managing users, suspending accounts, verifying organizations)
      - Organization tasks (creating opportunities, reviewing applications, marking attendance)
      - Any data belonging to other volunteers
      - Database queries, API keys, or backend logic
      
      If asked about anything outside this scope, reply:
      "That feature is not available for your account. Please contact your organization or admin."`,

      suggestions: [
        'How do I apply for an opportunity?',
        'Where can I see my volunteer hours?',
        'How do I update my skills?',
        'How do I find new events?',
      ],
      title: 'Volunteer Assistant',
    },

    organization: {
      systemPrompt: `You are a helpful assistant for the VolunteerMS platform.
      You are talking to an ORGANIZATION user.
      You can ONLY help with:
      - Creating and managing volunteer opportunities
      - Reviewing and approving/rejecting volunteer applications
      - Creating and managing events
      - Marking volunteer attendance at events
      - Viewing their organization dashboard and reports
      - Updating their organization profile
      
      You must REFUSE to help with or discuss:
      - Admin tasks (suspending users, verifying other organizations, accessing system logs)
      - Volunteer personal data beyond what is needed for their application
      - Any other organization's data or opportunities
      - Database queries, API keys, or backend logic
      
      If asked about anything outside this scope, reply:
      "That action is outside your organization's permissions. Please contact the platform admin."`,

      suggestions: [
        'How do I create a new opportunity?',
        'How do I approve a volunteer application?',
        'How do I mark attendance for an event?',
        'How do I view my reports?',
      ],
      title: 'Organization Assistant',
    },

    admin: {
      systemPrompt: `You are a helpful assistant for the VolunteerMS platform.
      You are talking to an ADMIN user.
      You can help with:
      - Managing all users (activating, suspending accounts)
      - Verifying or revoking organization verification
      - Viewing platform analytics and reports
      - Monitoring activity logs
      - Managing all opportunities and events
      - Accessing the admin dashboard overview
      
      You must REFUSE to:
      - Reveal or discuss API keys, JWT secrets, or environment variables
      - Execute or simulate direct database queries
      - Provide instructions to bypass platform security
      - Discuss other users' passwords or private data
      
      If asked about anything outside this scope, reply:
      "That falls outside admin capabilities in this platform."`,

      suggestions: [
        'How do I suspend a user account?',
        'How do I verify an organization?',
        'Where can I see platform analytics?',
        'How do I view activity logs?',
      ],
      title: 'Admin Assistant',
    },
  };

  const context = ROLE_CONTEXT[role] || ROLE_CONTEXT.volunteer;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async text => {
    if (!text.trim()) return;

    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post('/ai/chat', {
        message: text,
        system: context.systemPrompt,
      });

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content:
            response.data?.reply ||
            response.data?.message ||
            'Sorry, I could not process that request.',
        },
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'An error occurred while connecting to the assistant. Please try again later.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = suggestion => {
    handleSend(suggestion);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-105"
        >
          <MessageSquare size={24} />
        </button>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-[350px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-4rem)] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-primary-600 p-4 flex justify-between items-center text-white">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Bot size={20} />
                AI Assistant
              </h3>
              {user && (
                <span className="text-xs bg-primary-700 px-2 py-0.5 rounded-full inline-block mt-1">
                  {context.title}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-primary-700 p-1 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Chat Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-end">
                <div className="text-center mb-6">
                  <div className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bot size={24} />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Hi! I'm your {context.title}. How can I help you today?
                  </p>
                </div>

                {user && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Suggested questions:
                    </p>
                    {context.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 rounded-xl px-4 py-2 transition-colors shadow-sm"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary-600 text-white rounded-tr-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-sm shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-primary-600" />
                  <span className="text-xs text-slate-500">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            {!user ? (
              <div className="text-center py-2 text-sm text-slate-500 italic bg-slate-100 dark:bg-slate-800 rounded-xl">
                Please log in to use the assistant.
              </div>
            ) : (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSend(input);
                }}
                className="flex gap-2 relative"
              >
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl p-2.5 transition-colors shrink-0 flex items-center justify-center"
                >
                  <Send size={18} />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;
