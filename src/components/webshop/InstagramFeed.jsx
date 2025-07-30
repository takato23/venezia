import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Instagram, Heart, MessageCircle, ExternalLink } from 'lucide-react';

const InstagramFeed = () => {
  // Simulamos posts de Instagram con imágenes de Unsplash
  const [posts, setPosts] = useState([]);
  
  useEffect(() => {
    // En producción, esto vendría de la API de Instagram
    const mockPosts = [
      {
        id: 1,
        image: 'https://source.unsplash.com/400x400/?gelato,italian',
        likes: 234,
        comments: 12,
        caption: 'Nuevo sabor de pistacho 🍨',
        link: 'https://instagram.com/p/1'
      },
      {
        id: 2,
        image: 'https://source.unsplash.com/400x400/?ice-cream,chocolate',
        likes: 456,
        comments: 23,
        caption: 'Triple chocolate belga 🍫',
        link: 'https://instagram.com/p/2'
      },
      {
        id: 3,
        image: 'https://source.unsplash.com/400x400/?ice-cream,strawberry',
        likes: 789,
        comments: 45,
        caption: 'Frutilla con crema 🍓',
        link: 'https://instagram.com/p/3'
      },
      {
        id: 4,
        image: 'https://source.unsplash.com/400x400/?gelato,vanilla',
        likes: 567,
        comments: 34,
        caption: 'Clásica vainilla madagascar',
        link: 'https://instagram.com/p/4'
      },
      {
        id: 5,
        image: 'https://source.unsplash.com/400x400/?ice-cream,mint',
        likes: 890,
        comments: 56,
        caption: 'Menta granizada especial 🌿',
        link: 'https://instagram.com/p/5'
      },
      {
        id: 6,
        image: 'https://source.unsplash.com/400x400/?gelato,coffee',
        likes: 432,
        comments: 21,
        caption: 'Café espresso italiano ☕',
        link: 'https://instagram.com/p/6'
      }
    ];
    
    setPosts(mockPosts);
  }, []);
  
  return (
    <section className="py-20 bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Instagram className="h-8 w-8 text-pink-600" />
            <h2 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              @veneziagelato
            </h2>
          </div>
          <p className="text-gray-600 text-lg">
            Síguenos en Instagram para ver nuestras últimas creaciones
          </p>
        </motion.div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {posts.map((post, index) => (
            <motion.a
              key={post.id}
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="group relative aspect-square overflow-hidden rounded-2xl shadow-lg"
            >
              <img
                src={post.image}
                alt={post.caption}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              
              {/* Overlay con información */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <p className="text-sm font-medium mb-2 line-clamp-2">{post.caption}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4 fill-current" />
                      {post.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      {post.comments}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Icono de Instagram */}
              <div className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="h-4 w-4 text-gray-700" />
              </div>
            </motion.a>
          ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <a
            href="https://instagram.com/veneziagelato"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transition-all"
          >
            <Instagram className="h-5 w-5" />
            Seguir en Instagram
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default InstagramFeed;