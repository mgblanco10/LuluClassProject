// Importar Three.js y GLTFLoader usando módulos ES6
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

console.log('✅ Script.js cargado');
console.log('THREE disponible:', typeof THREE !== 'undefined');
console.log('GLTFLoader disponible:', typeof GLTFLoader !== 'undefined');

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ DOM cargado, iniciando aplicación...');
  
  // Mostrar información de debug
  const debugInfo = document.getElementById('debugInfo');
  function updateDebug(msg) {
    if (debugInfo) {
      debugInfo.textContent = msg;
    }
    console.log('DEBUG:', msg);
  }
  
  updateDebug('Iniciando...');
  
  // Verificar que Three.js esté disponible
  if (typeof THREE === 'undefined') {
    updateDebug('❌ Error: Three.js no está disponible');
    alert('Error: Three.js no se cargó. Recarga la página.');
    return;
  }
  
  // Verificar que GLTFLoader esté disponible
  if (typeof GLTFLoader === 'undefined') {
    updateDebug('❌ Error: GLTFLoader no está disponible');
    alert('Error: GLTFLoader no se cargó. Recarga la página.');
    return;
  }
  
  updateDebug('✅ Three.js y GLTFLoader OK');
  
  let scene, camera, renderer, loader;
  let currentModel;
  let isDragging = false;
  
  // Configurar inputs PRIMERO (antes del 3D)
  function setupInputs() {
    console.log('🔧 Configurando inputs...');
    
    // INTERACCIONES - Nombre
    const nameInput = document.getElementById("nameInput");
    const nameDisplay = document.getElementById("nameDisplay");
    
    if (nameInput && nameDisplay) {
      // Ocultar el saludo inicialmente
      nameDisplay.textContent = "";
      nameDisplay.style.display = "none";
      
      nameInput.addEventListener("input", function(e) {
        const name = e.target.value.trim();
        if (name) {
          nameDisplay.textContent = `¡Hola ${name}! ✨`;
          nameDisplay.style.display = "block";
          console.log('✅ Nombre actualizado:', name);
        } else {
          nameDisplay.textContent = "";
          nameDisplay.style.display = "none";
        }
      });
      console.log('✅ Input de nombre configurado');
    } else {
      console.error('❌ No se encontraron elementos de nombre');
      updateDebug('❌ Error: elementos de nombre no encontrados');
    }
    
    // Función para aplicar color al fondo
    function applyBackgroundColor(colorValue) {
      if (!colorValue || colorValue.trim() === "") {
        document.body.style.background = "linear-gradient(135deg, #e8e8e8 0%, #f5f5f5 50%, #ffffff 100%)";
        return;
      }
      
      const color = colorValue.trim();
      console.log('🎨 Aplicando color:', color);
      document.body.style.background = color;
      document.body.style.backgroundColor = color;
      updateDebug('Color: ' + color);
    }
    
    // Color del fondo (sin botón, funciona al escribir)
    const colorInput = document.getElementById("colorInput");
    
    if (colorInput) {
      colorInput.addEventListener("input", function(e) {
        console.log('🎨 Color cambiado:', e.target.value);
        applyBackgroundColor(e.target.value);
      });
      
      colorInput.addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
          applyBackgroundColor(e.target.value);
        }
      });
      console.log('✅ Input de color configurado');
    } else {
      console.error('❌ No se encontró colorInput');
    }
    
    // Tipo de letra
    const fontSelect = document.getElementById("fontSelect");
    if (fontSelect && nameDisplay) {
      fontSelect.addEventListener("change", function(e) {
        nameDisplay.style.fontFamily = e.target.value;
        console.log('✅ Fuente cambiada a:', e.target.value);
      });
      console.log('✅ Selector de fuente configurado');
    }
    
    // Selector de modelo - carga automáticamente al seleccionar
    const modelSelect = document.getElementById("modelSelect");
    
    if (modelSelect) {
      modelSelect.addEventListener("change", function(e) {
        const selectedModel = e.target.value;
        if (selectedModel && selectedModel !== "") {
          console.log('🔄 Modelo seleccionado:', selectedModel);
          updateDebug('Cargando: ' + selectedModel);
          loadModel(selectedModel);
        } else {
          // Si seleccionan la opción vacía, remover el modelo actual
          if (currentModel) {
            scene.remove(currentModel);
            currentModel = null;
            updateDebug('Modelo removido');
          }
        }
      });
      console.log('✅ Selector de modelo configurado');
    }
    
    // Selector de fondo - carga automáticamente al seleccionar
    const backgroundSelect = document.getElementById("backgroundSelect");
    
    if (backgroundSelect) {
      backgroundSelect.addEventListener("change", function(e) {
        const selectedBackground = e.target.value;
        if (selectedBackground && selectedBackground !== "") {
          console.log('🖼️ Fondo seleccionado:', selectedBackground);
          updateDebug('Cargando fondo: ' + selectedBackground);
          loadBackground(selectedBackground);
        } else {
          // Si seleccionan la opción vacía, usar color sólido
          scene.background = new THREE.Color(0x000000);
          updateDebug('Fondo removido');
        }
      });
      console.log('✅ Selector de fondo configurado');
    }
    
    updateDebug('✅ Inputs configurados');
  }
  
  // Inicializar escena 3D
  function init3D() {
    console.log('🎬 Inicializando escena 3D...');
    updateDebug('Inicializando 3D...');
    
    try {
      scene = new THREE.Scene();
      
      // Fondo inicial: negro (se cambiará cuando el usuario seleccione uno)
      scene.background = new THREE.Color(0x000000);
      
      console.log('✅ Escena creada');
      
      camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / 400,
        0.1,
        1000
      );
      // Ajustar cámara para que el modelo se vea más arriba
      camera.position.set(0, 2.5, 4);
      camera.lookAt(0, 1, 0);
      console.log('✅ Cámara creada');
      
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, 400);
      renderer.setClearColor(0x000000, 1); // Color negro (se verá la imagen de fondo del skybox)
      console.log('✅ Renderer creado');
      
      const sceneElement = document.getElementById("scene");
      if (!sceneElement) {
        console.error('❌ No se encontró el elemento #scene');
        updateDebug('❌ Error: #scene no encontrado');
        return false;
      }
      
      sceneElement.appendChild(renderer.domElement);
      console.log('✅ Canvas agregado al DOM');
      
      // Luces
      const ambient = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambient);
      
      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(5, 5, 5);
      scene.add(light);
      
      const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
      light2.position.set(-5, 3, -5);
      scene.add(light2);
      console.log('✅ Luces configuradas');
      
      // Inicializar loader
      loader = new GLTFLoader();
      console.log('✅ GLTFLoader inicializado');
      
      // Configurar interacción con mouse (rotar y mover)
      let lastX = 0;
      let lastY = 0;
      let isRotating = false;
      let isMoving = false;
      
      renderer.domElement.addEventListener("mousedown", function(e) {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        
        // Si presiona Shift, mover; si no, rotar
        if (e.shiftKey) {
          isMoving = true;
          isRotating = false;
          renderer.domElement.style.cursor = "move";
        } else {
          isRotating = true;
          isMoving = false;
          renderer.domElement.style.cursor = "grabbing";
        }
        
        e.preventDefault();
      });
      
      window.addEventListener("mouseup", function() {
        isDragging = false;
        isRotating = false;
        isMoving = false;
        renderer.domElement.style.cursor = "grab";
      });
      
      window.addEventListener("mousemove", function(e) {
        if (isDragging && currentModel) {
          const deltaX = e.clientX - lastX;
          const deltaY = e.clientY - lastY;
          
          if (e.shiftKey || isMoving) {
            // Mover el modelo
            const moveSpeed = 0.015;
            currentModel.position.x += deltaX * moveSpeed;
            currentModel.position.y -= deltaY * moveSpeed; // Invertir Y para que sea intuitivo
            renderer.domElement.style.cursor = "move";
          } else if (isRotating) {
            // Rotar en Y (horizontal)
            currentModel.rotation.y += deltaX * 0.01;
            renderer.domElement.style.cursor = "grabbing";
          }
          
          lastX = e.clientX;
          lastY = e.clientY;
        }
      });
      
      // Cambiar cursor cuando se presiona Shift
      renderer.domElement.addEventListener("mouseenter", function() {
        renderer.domElement.style.cursor = "grab";
      });
      
      window.addEventListener("keydown", function(e) {
        if (e.shiftKey && renderer.domElement) {
          renderer.domElement.style.cursor = "move";
        }
      });
      
      window.addEventListener("keyup", function(e) {
        if (!e.shiftKey && renderer.domElement && !isDragging) {
          renderer.domElement.style.cursor = "grab";
        }
      });
      
      renderer.domElement.style.cursor = "grab";
      
      // Manejar redimensionamiento
      window.addEventListener('resize', function() {
        camera.aspect = window.innerWidth / 400;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, 400);
      });
      
      updateDebug('✅ Escena 3D lista');
      return true;
    } catch (error) {
      console.error('❌ Error inicializando 3D:', error);
      updateDebug('❌ Error en 3D: ' + error.message);
      return false;
    }
  }
  
  function loadModel(file) {
    if (!loader) {
      console.error('❌ Loader no está inicializado');
      updateDebug('❌ Loader no disponible');
      return;
    }
    
    console.log('📦 Cargando modelo:', file);
    updateDebug('Cargando: ' + file);
    
    if (currentModel) {
      scene.remove(currentModel);
      currentModel = null;
    }
    
    const modelPath = `models/${file}`;
    console.log('📂 Ruta del modelo:', modelPath);
    
    loader.load(
      modelPath,
      // Success callback
      function(gltf) {
        console.log('✅ Modelo cargado exitosamente:', file);
        currentModel = gltf.scene;
        currentModel.scale.set(1, 1, 1);
        
        // Centrar y ajustar el modelo
        const box = new THREE.Box3().setFromObject(currentModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        console.log('📐 Tamaño del modelo:', size);
        console.log('📍 Centro del modelo:', center);
        
        // Centrar el modelo pero posicionarlo más arriba
        currentModel.position.x = -center.x;
        currentModel.position.y = -center.y + 1.5; // Subir el modelo 1.5 unidades
        currentModel.position.z = -center.z;
        
        // Ajustar escala (hacer los modelos más grandes)
        const maxDimension = Math.max(size.x, size.y, size.z);
        console.log('📏 Dimensión máxima:', maxDimension);
        
        const scaleMultiplier = 2.2; // Multiplicador para hacer los modelos más grandes
        
        if (maxDimension > 3) {
          const scale = (3.0 / maxDimension) * scaleMultiplier; // Aumentado para modelos grandes
          currentModel.scale.set(scale, scale, scale);
          console.log('🔍 Escala aplicada (reducir):', scale);
        } else if (maxDimension < 0.5) {
          const scale = (2.0 / maxDimension) * scaleMultiplier; // Aumentado para modelos pequeños
          currentModel.scale.set(scale, scale, scale);
          console.log('🔍 Escala aplicada (aumentar):', scale);
        } else {
          // Para modelos de tamaño medio, aplicar el multiplicador directamente
          currentModel.scale.set(scaleMultiplier, scaleMultiplier, scaleMultiplier);
          console.log('🔍 Escala aplicada (tamaño medio):', scaleMultiplier);
        }
        
        scene.add(currentModel);
        updateDebug('✅ Modelo cargado: ' + file);
        console.log('✅ Modelo agregado a la escena');
      },
      // Progress callback
      function(progress) {
        if (progress.lengthComputable) {
          const percentComplete = (progress.loaded / progress.total) * 100;
          console.log('⏳ Cargando:', Math.round(percentComplete) + '%');
          updateDebug('Cargando: ' + Math.round(percentComplete) + '%');
        } else {
          console.log('⏳ Cargando modelo...');
        }
      },
      // Error callback
      function(error) {
        console.error("❌ Error cargando el modelo:", error);
        console.error("Detalles del error:", {
          message: error.message,
          stack: error.stack,
          file: file,
          path: modelPath
        });
        updateDebug('❌ Error: ' + file);
        alert("¡Ups! No se pudo cargar el modelo " + file + ".\n\nError: " + error.message + "\n\nVerifica la consola para más detalles.");
      }
    );
  }
  
  function loadBackground(file) {
    if (!scene) {
      console.error('❌ Escena no está inicializada');
      updateDebug('❌ Escena no disponible');
      return;
    }
    
    console.log('🖼️ Cargando fondo:', file);
    updateDebug('Cargando fondo: ' + file);
    
    const textureLoader = new THREE.TextureLoader();
    const backgroundPath = `background/${file}`;
    console.log('📂 Ruta del fondo:', backgroundPath);
    
    textureLoader.load(
      backgroundPath,
      function(texture) {
        console.log('✅ Textura de fondo cargada exitosamente');
        
        // Procesar la textura para mejorar colores antes de aplicarla
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = texture.image.width;
        canvas.height = texture.image.height;
        
        ctx.drawImage(texture.image, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Aplicar mejoras de color (saturación, contraste, brillo)
        const saturation = 1.6;
        const contrast = 1.3;
        const brightness = 1.15;
        
        for (let i = 0; i < data.length; i += 4) {
          let r = data[i] / 255;
          let g = data[i + 1] / 255;
          let b = data[i + 2] / 255;
          
          // Aumentar brillo
          r *= brightness;
          g *= brightness;
          b *= brightness;
          
          // Aumentar contraste
          r = ((r - 0.5) * contrast) + 0.5;
          g = ((g - 0.5) * contrast) + 0.5;
          b = ((b - 0.5) * contrast) + 0.5;
          
          // Aumentar saturación
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = gray + (r - gray) * saturation;
          g = gray + (g - gray) * saturation;
          b = gray + (b - gray) * saturation;
          
          // Asegurar valores en rango
          data[i] = Math.max(0, Math.min(255, r * 255));
          data[i + 1] = Math.max(0, Math.min(255, g * 255));
          data[i + 2] = Math.max(0, Math.min(255, b * 255));
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Crear nueva textura desde el canvas procesado
        const processedTexture = new THREE.CanvasTexture(canvas);
        processedTexture.wrapS = THREE.ClampToEdgeWrapping;
        processedTexture.wrapT = THREE.ClampToEdgeWrapping;
        
        // Usar scene.background directamente - muestra la imagen completa sin recortes
        scene.background = processedTexture;
        
        updateDebug('✅ Fondo cargado: ' + file);
        console.log('✅ Fondo aplicado exitosamente');
      },
      undefined,
      function(error) {
        console.error('❌ Error cargando la textura de fondo:', error);
        updateDebug('❌ Error cargando fondo: ' + file);
        // Fallback: usar color sólido si falla la carga
        scene.background = new THREE.Color(0x000000);
        alert("¡Ups! No se pudo cargar el fondo " + file + ".\n\nError: " + error.message);
      }
    );
  }
  
  function animate() {
    requestAnimationFrame(animate);
    if (renderer && scene && camera) {
      if (currentModel && !isDragging) {
        currentModel.rotation.y += 0.005;
      }
      renderer.render(scene, camera);
    }
  }
  
  // Inicializar todo
  console.log('🚀 Iniciando aplicación...');
  
  // Configurar inputs primero (funcionan independientemente del 3D)
  setupInputs();
  
  // Inicializar 3D
  if (init3D()) {
    // NO cargar modelo automáticamente - esperar a que el usuario seleccione uno
    updateDebug('✅ Listo! Selecciona un personaje para verlo');
    
    // Iniciar animación
    animate();
    console.log('✅ Animación iniciada');
  } else {
    updateDebug('❌ Error inicializando 3D');
  }
  
  // Ocultar mensaje de prueba después de 5 segundos
  setTimeout(() => {
    const testMsg = document.getElementById('testMessage');
    if (testMsg) {
      testMsg.style.display = 'none';
    }
  }, 5000);
  
  console.log('✅ Aplicación completamente iniciada');
  updateDebug('✅ Todo listo!');
});
