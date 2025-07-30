const axios = require('axios');

const API_KEY = 'AIzaSyCuSgA0UIHHhmq8YjXD1e_Nn8582EG3gVU';

async function testGeminiAPI() {
  console.log('🤖 Probando Gemini API...');
  
  try {
    const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      contents: [{
        parts: [{ 
          text: "Eres VenezIA, el asistente de la heladería Venezia. Responde: ¿Cómo puedes ayudar a gestionar el inventario de helados?" 
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
        topP: 0.8,
        topK: 40
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = response.data;
    const aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (aiMessage) {
      console.log('✅ Gemini API funciona correctamente!');
      console.log('📝 Respuesta de VenezIA:');
      console.log('---');
      console.log(aiMessage);
      console.log('---');
      
      // Test de comando específico
      console.log('\n🎯 Probando comando específico...');
      const commandResponse = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
        contents: [{
          parts: [{ 
            text: `Eres VenezIA, asistente de heladería Venezia. 
            
            El usuario dice: "agregar 10 kg de chocolate al inventario"
            
            Interpreta esto como un comando para agregar stock y responde confirmando que entendiste la acción a realizar.` 
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 200
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const commandData = commandResponse.data;
      const commandMessage = commandData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (commandMessage) {
        console.log('✅ Interpretación de comandos funciona!');
        console.log('📝 Respuesta al comando:');
        console.log('---');
        console.log(commandMessage);
        console.log('---');
      }
      
      return true;
    } else {
      throw new Error('No se recibió respuesta del modelo');
    }
  } catch (error) {
    console.error('❌ Error probando Gemini API:', error.message);
    return false;
  }
}

// Ejecutar test
testGeminiAPI().then(success => {
  if (success) {
    console.log('\n🎉 ¡Gemini API configurado y funcionando correctamente!');
    console.log('💡 El SuperBot Venezia ahora puede usar inteligencia artificial real.');
  } else {
    console.log('\n💥 Hay problemas con la configuración de Gemini API.');
  }
  process.exit(success ? 0 : 1);
});