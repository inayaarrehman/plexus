import React from 'react'
import Modal from './Modal.jsx'

export default function HowToModal({ onClose }) {
  return (
    <Modal onClose={onClose} title="How to play">
      <ul className="howto-list">
        <li>Find groups of <strong>4 clinical concepts</strong> that share a hidden connection.</li>
        <li>Tap up to 4 tiles, then hit <strong>Submit</strong> to lock in a guess.</li>
        <li>Each puzzle has 4 categories, from <span className="pill pill-1">easier</span> to <span className="pill pill-4">trickier</span>.</li>
        <li>Watch for red herrings — an item may look like it fits more than one group.</li>
        <li>You get <strong>4 mistakes</strong> before the puzzle ends. Good luck, doctor.</li>
      </ul>
    </Modal>
  )
}
