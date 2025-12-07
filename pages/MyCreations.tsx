
import React, { useEffect, useState } from 'react';
import { MockBackend } from '../services/mockBackend';
import { SavedFile } from '../types';
import { Image, Video, Music, FileText, Download, Trash2, Filter } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const MyCreations: React.FC = () => {
  const [files, setFiles] = useState<SavedFile[]>([]);
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'audio'>('all');
  const user = MockBackend.getCurrentUser();

  useEffect(() => {
    if (user) {
        setFiles(MockBackend.getSavedFiles(user.id));
    }
  }, [user]);

  if (!user) return <Navigate to="/welcome" />;

  const handleDelete = (id: string) => {
      if (confirm("Are you sure you want to delete this file?")) {
          MockBackend.deleteSavedFile(id);
          setFiles(prev => prev.filter(f => f.id !== id));
      }
  };

  const filteredFiles = filter === 'all' ? files : files.filter(f => f.type === filter);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">My Creations</h1>
          <p className="text-slate-400 mt-2">Gallery of your generated content.</p>
        </div>
        
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
            {['all', 'image', 'video', 'audio'].map(f => (
                <button
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                        filter === f ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    {f}
                </button>
            ))}
        </div>
      </div>

      {filteredFiles.length === 0 ? (
          <div className="text-center py-20 bg-surface rounded-3xl border border-slate-700 border-dashed">
              <div className="inline-flex p-4 rounded-full bg-slate-800 mb-4">
                 <Filter size={32} className="text-slate-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No creations found</h3>
              <p className="text-slate-400">Start using the AI tools to populate your gallery.</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredFiles.map(file => (
                  <div key={file.id} className="group bg-surface rounded-xl border border-slate-700 overflow-hidden hover:border-slate-500 transition-all flex flex-col">
                      <div className="relative aspect-square bg-slate-900 flex items-center justify-center overflow-hidden">
                          {file.type === 'image' && (
                              <img src={file.url} alt={file.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                          )}
                          {file.type === 'video' && (
                              <div className="w-full h-full relative">
                                  <video src={file.url} className="w-full h-full object-cover" controls />
                                  <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1">
                                      <Video size={12} /> Video
                                  </div>
                              </div>
                          )}
                          {file.type === 'audio' && (
                               <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 p-4">
                                   <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
                                       <Music className="text-indigo-400" size={32} />
                                   </div>
                                   <audio src={file.url} controls className="w-full h-8" />
                               </div>
                          )}
                          {file.type === 'document' && (
                              <FileText size={48} className="text-slate-500" />
                          )}
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                              <h4 className="font-bold text-white text-sm line-clamp-1 mb-1">{file.name}</h4>
                              <p className="text-xs text-slate-500">{new Date(file.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-700/50">
                              <a 
                                href={file.url} 
                                download 
                                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                title="Download"
                              >
                                  <Download size={16} />
                              </a>
                              <button 
                                onClick={() => handleDelete(file.id)}
                                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                                title="Delete"
                              >
                                  <Trash2 size={16} />
                              </button>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};

export default MyCreations;
