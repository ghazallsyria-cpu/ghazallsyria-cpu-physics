
import React, { useState, useEffect } from 'react';
import { User, Todo } from '../types';
import { dbService } from '../services/db';
import { Trash2, Check, Plus, Calendar, ListFilter, Trophy, AlertTriangle } from 'lucide-react';

interface TodoListProps {
  user: User;
}

const TodoList: React.FC<TodoListProps> = ({ user }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [category, setCategory] = useState<Todo['category']>('Study');
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadTodos = async () => {
      setIsLoading(true);
      const cloudTodos = await dbService.getTodos(user.uid);
      setTodos(cloudTodos);
      setIsLoading(false);
    };

    loadTodos();
  }, [user]);


  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    
    const newTodoData: Omit<Todo, 'id'> = {
      text: input,
      completed: false,
      category,
      createdAt: Date.now(),
      dueDate: dueDate || undefined
    };

    // Optimistic update
    const tempId = `temp_${Date.now()}`;
    setTodos([{ ...newTodoData, id: tempId }, ...todos]);
    setInput('');
    setDueDate('');

    try {
      const newId = await dbService.saveTodo(user.uid, newTodoData);
      // Replace temp ID with real ID
      setTodos(prev => prev.map(t => t.id === tempId ? { ...t, id: newId } : t));
    } catch (e) {
      console.error("Failed to save todo", e);
      // Revert if save fails
      setTodos(prev => prev.filter(t => t.id !== tempId));
    }
  };

  const toggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo || !user) return;

    const newCompletedState = !todo.completed;
    // Optimistic update
    setTodos(todos.map(t => t.id === id ? { ...t, completed: newCompletedState } : t));

    try {
      await dbService.updateTodo(user.uid, id, { completed: newCompletedState });
    } catch (e) {
      console.error("Failed to update todo", e);
      // Revert on failure
      setTodos(todos.map(t => t.id === id ? { ...t, completed: !newCompletedState } : t));
    }
  };

  const deleteTodo = async (id: string) => {
    if (!user) return;
    const originalTodos = [...todos];
    setTodos(todos.filter(t => t.id !== id));
    try {
      await dbService.deleteTodo(user.uid, id);
    } catch (e) {
      console.error("Failed to delete todo", e);
      setTodos(originalTodos);
    }
  };

  const completedCount = todos.filter(t => t.completed).length;
  const progress = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  const filteredTodos = todos.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const getCategoryStyles = (cat: Todo['category']) => {
    switch (cat) {
      case 'Study': return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', icon: '📚' };
      case 'Exam': return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: '📝' };
      case 'Lab': return { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', icon: '🧪' };
      case 'Review': return { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', icon: '🔄' };
      case 'Homework': return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', icon: '📓' };
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
      
      {/* Header & Stats */}
      <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-white mb-2 tracking-tighter flex items-center gap-3">
            قائمة <span className="text-[#00d2ff]">الإنجاز</span> <Trophy className="w-8 h-8 text-[#fbbf24]" />
          </h2>
          <p className="text-gray-500 text-lg font-medium">نظّم وقتك، وحقق أهدافك الدراسية خطوة بخطوة.</p>
        </div>
        
        {/* Progress Bar */}
        <div className="bg-slate-800/50 p-6 rounded-[30px] border border-white/5 w-full md:w-64 backdrop-blur-sm">
           <div className="flex justify-between text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
              <span>معدل الإنجاز</span>
              <span className="text-[#00d2ff]">{progress}%</span>
           </div>
           <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#00d2ff] to-blue-600 transition-all duration-700 shadow-[0_0_15px_#00d2ff]" 
                style={{ width: `${progress}%` }}
              ></div>
           </div>
           <p className="text-[10px] text-gray-500 mt-3 font-bold text-center">
             {completedCount} من أصل {todos.length} مهام مكتملة
           </p>
        </div>
      </div>

      <div className="glass-panel p-8 md:p-10 rounded-[50px] border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent relative overflow-hidden">
        
        {/* Add Todo Form */}
        <form onSubmit={addTodo} className="relative z-10 mb-10">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="أضف مهمة جديدة (مثلاً: حل مسائل الفصل الثاني)..."
                  className="w-full bg-black/40 border border-white/10 rounded-[24px] pr-6 pl-4 py-5 text-white outline-none focus:border-[#00d2ff] transition-all font-bold placeholder-gray-600 focus:bg-black/60 shadow-inner"
                />
            </div>
            
            <div className="flex gap-3">
                <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="bg-black/40 border border-white/10 rounded-[24px] px-4 py-4 text-white outline-none focus:border-[#00d2ff] font-bold text-sm appearance-none cursor-pointer hover:bg-black/60 transition-all"
                    title="تاريخ الاستحقاق (اختياري)"
                />
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="bg-black/40 border border-white/10 rounded-[24px] px-6 py-4 text-white outline-none focus:border-[#00d2ff] font-bold text-sm appearance-none cursor-pointer hover:bg-black/60 transition-all"
                >
                  <option value="Study">📚 دراسة</option>
                  <option value="Homework">📓 واجب</option>
                  <option value="Exam">📝 اختبار</option>
                  <option value="Lab">🧪 مختبر</option>
                  <option value="Review">🔄 مراجعة</option>
                </select>
                
                <button 
                  type="submit" 
                  disabled={!input.trim()}
                  className="bg-[#00d2ff] text-black px-8 py-4 rounded-[24px] font-black hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center"
                >
                  <Plus className="w-6 h-6" />
                </button>
            </div>
          </div>
        </form>

        {/* Filters */}
        <div className="flex justify-between items-center mb-6 pb-6 border-b border-white/5">
           <div className="flex gap-2">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'active', label: 'قيد التنفيذ' },
                { id: 'completed', label: 'مكتملة' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id as any)}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f.id ? 'bg-white/10 text-white border border-white/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                >
                  {f.label}
                </button>
              ))}
           </div>
           <div className="flex items-center gap-2 text-gray-500">
              <ListFilter className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase hidden sm:inline">تصفية القائمة</span>
           </div>
        </div>

        {/* Todo List */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar pr-1">
          {isLoading ? (
            <div className="text-center py-20 text-gray-500 animate-pulse">جاري تحميل المهام...</div>
          ) : filteredTodos.length > 0 ? filteredTodos.map(todo => {
            const style = getCategoryStyles(todo.category);
            const today = new Date();
            today.setHours(0, 0, 0, 0); 
            const isOverdue = todo.dueDate && !todo.completed && new Date(todo.dueDate) < today;
            return (
              <div 
                key={todo.id} 
                className={`flex items-center justify-between p-5 rounded-[30px] border transition-all group animate-slideUp ${
                  todo.completed 
                    ? 'bg-black/20 border-white/5 opacity-60 hover:opacity-100' 
                    : isOverdue ? 'bg-red-500/10 border-red-500/20' : 'bg-white/[0.03] border-white/5 hover:border-[#00d2ff]/30 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-5 flex-1 min-w-0">
                  <button 
                    onClick={() => toggleTodo(todo.id)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 ${
                      todo.completed 
                        ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
                        : isOverdue ? 'bg-red-500/20 border-2 border-red-400 text-red-400' : 'bg-white/5 border-2 border-white/10 hover:border-[#00d2ff] hover:text-[#00d2ff] text-transparent'
                    }`}
                  >
                    <Check className="w-6 h-6" strokeWidth={4} />
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-lg font-bold mb-1 truncate transition-all ${todo.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                      {todo.text}
                    </p>
                    <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${style.bg} ${style.text} ${style.border}`}>
                          <span>{style.icon}</span>
                          {todo.category}
                        </span>
                        {todo.dueDate ? (
                          <span className={`text-[9px] font-mono flex items-center gap-1.5 font-bold ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
                            <Calendar className="w-3 h-3" />
                            {isOverdue && <AlertTriangle className="w-3 h-3 animate-pulse" />}
                            مستحق في: {new Date(todo.dueDate).toLocaleDateString('ar-KW', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        ) : (
                          <span className="text-[9px] text-gray-600 font-mono flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            أضيف في: {new Date(todo.createdAt).toLocaleDateString('ar-KW')}
                          </span>
                        )}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => deleteTodo(todo.id)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-600 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                  title="حذف المهمة"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            );
          }) : (
            <div className="py-20 text-center flex flex-col items-center justify-center opacity-30 border-2 border-dashed border-white/5 rounded-[40px]">
               <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                 <Check className="w-10 h-10 text-gray-500" />
               </div>
               <p className="font-black text-sm text-gray-500 uppercase tracking-[0.2em]">
                 {filter === 'completed' ? 'لا توجد مهام منجزة بعد' : 'القائمة فارغة، أضف هدفك الأول!'}
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodoList;
