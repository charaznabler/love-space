import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Smile, Frown, Meh, Heart, AlertCircle } from 'lucide-react';

import type { DiaryEntry } from '../types';
import { supabase } from '../lib/supabase';

const Diary: React.FC = () => {
    const [entries, setEntries] = useState<DiaryEntry[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newEntry, setNewEntry] = useState<Partial<DiaryEntry>>({ mood: 'happy' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEntries = async () => {
            const { data, error } = await supabase
                .from('diary')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching diary:', error);
                return;
            }

            if (data) {
                setEntries(data.map((row: any) => ({
                    id: row.id,
                    date: row.created_at,
                    title: row.title,
                    content: row.content,
                    mood: row.mood
                })));
            }
            setLoading(false);
        };

        fetchEntries();

        const channel = supabase
            .channel('diary_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'diary' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newRow = payload.new as any;
                        const entry: DiaryEntry = {
                            id: newRow.id,
                            date: newRow.created_at,
                            title: newRow.title,
                            content: newRow.content,
                            mood: newRow.mood
                        };
                        setEntries(prev => [entry, ...prev]);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleAdd = async () => {
        if (!newEntry.title || !newEntry.content) return;

        const { error } = await supabase
            .from('diary')
            .insert([{
                title: newEntry.title,
                content: newEntry.content,
                mood: newEntry.mood || 'happy'
            }]);

        if (error) {
            console.error('Error adding entry:', error);
            return;
        }

        setIsAdding(false);
        setNewEntry({ mood: 'happy', title: '', content: '' });
    };

    const getMoodIcon = (mood: string) => {
        switch (mood) {
            case 'happy': return <Smile className="text-yellow-400" />;
            case 'sad': return <Frown className="text-blue-400" />;
            case 'loving': return <Heart className="text-love-500" fill="currentColor" />;
            case 'angry': return <AlertCircle className="text-red-400" />;
            default: return <Meh className="text-gray-400" />;
        }
    };

    return (
        <div className="flex flex-col h-full">
            <header className="flex justify-between items-center mb-6 pt-4">
                <div>
                    <h1 className="text-2xl font-bold text-love-900">我们的日记</h1>
                    <p className="text-sm text-love-400">记录每一个感动的瞬间</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={20} /> 写日记
                </button>
            </header>

            {/* Entry List */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-love-500"></div>
                    </div>
                ) : entries.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <BookHeartIcon />
                        <p className="mt-4">还没有日记哦，快来写第一篇吧~</p>
                    </div>
                ) : (
                    entries.map((entry) => (
                        <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-panel p-5 relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold text-gray-800">{entry.title}</h3>
                                <div className="p-2 bg-white/50 rounded-full">
                                    {getMoodIcon(entry.mood)}
                                </div>
                            </div>
                            <p className="text-gray-600 whitespace-pre-wrap text-sm leading-relaxed mb-3">
                                {entry.content}
                            </p>
                            <div className="text-xs text-gray-400 text-right">
                                {new Date(entry.date).toLocaleString('zh-CN', {
                                    month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Add Modal */}
            {/* Add Modal */}
            {createPortal(
                <AnimatePresence>
                    {isAdding && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-sm p-4"
                        >
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-love-900">写下此刻的心情</h2>
                                    <button onClick={() => setIsAdding(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                                        <X size={20} className="text-gray-500" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <input
                                        placeholder="标题..."
                                        value={newEntry.title || ''}
                                        onChange={e => setNewEntry({ ...newEntry, title: e.target.value })}
                                        className="bg-love-50 border-transparent focus:bg-white focus:ring-2 focus:ring-love-200"
                                    />

                                    <textarea
                                        placeholder="今天发生了什么..."
                                        rows={5}
                                        value={newEntry.content || ''}
                                        onChange={e => setNewEntry({ ...newEntry, content: e.target.value })}
                                        className="bg-love-50 border-transparent focus:bg-white resize-none focus:ring-2 focus:ring-love-200"
                                    />

                                    <div className="flex gap-4 justify-between pt-2">
                                        {['happy', 'loving', 'sad', 'angry'].map((m) => (
                                            <button
                                                key={m}
                                                onClick={() => setNewEntry({ ...newEntry, mood: m as DiaryEntry['mood'] })}
                                                className={`p-3 rounded-2xl flex-1 flex justify-center transition-all ${newEntry.mood === m ? 'bg-love-100 ring-2 ring-love-300' : 'bg-love-50'}`}
                                            >
                                                {getMoodIcon(m)}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleAdd}
                                        disabled={!newEntry.title || !newEntry.content}
                                        className="btn-primary w-full mt-4 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        保存日记
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

// Placeholder icon component for empty state
const BookHeartIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="64" height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mx-auto text-pink-300"
    >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <path d="M12 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
    </svg>
);

export default Diary;
