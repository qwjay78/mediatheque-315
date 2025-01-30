import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    axios.get('/api/documents')
      .then(response => setDocuments(response.data))
      .catch(error => console.error(error));
  }, []);

  const borrowDocument = (id) => {
    axios.post(`/api/documents/borrow/${id}`)
      .then(response => {
        alert(response.data.message);
        setDocuments(documents.map(doc => doc._id === id ? { ...doc, available: false } : doc));
      })
      .catch(error => alert(error.response.data.message));
  };

  const returnDocument = (id) => {
    axios.post(`/api/documents/return/${id}`)
      .then(response => {
        alert(response.data.message);
        setDocuments(documents.map(doc => doc._id === id ? { ...doc, available: true } : doc));
      })
      .catch(error => alert(error.response.data.message));
  };

  return (
    <div>
      <h1>Médiathèque</h1>
      <ul>
        {documents.map(doc => (
          <li key={doc._id}>
            <strong>Titre:</strong> {doc.title} <br />
            <strong>Auteur:</strong> {doc.author} <br />
            <strong>Status:</strong> {doc.available ? 'Disponible' : 'Emprunté'}
            <br />
            <button onClick={() => doc.available ? borrowDocument(doc._id) : returnDocument(doc._id)}>
              {doc.available ? 'Emprunter' : 'Retourner'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;