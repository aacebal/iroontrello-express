const express = require('express');

const ListModel = require('../models/list-model');
const CardModel = require('../models/card-model');

const router  = express.Router();

const ensureLoggedInApiVersion = require('../lib/ensure-logged-in-api-version');

router.post('/api/lists/:id/cards', (req, res, next) => {
  CardModel
    .findOne({ list: req.params.id })
    .sort({ position: -1 })   // -1 means opposite order (3-2-1)
    .exec((err, lastCard) => {
        if (err) {
          res.status(500).json({ message: 'Find Card went to 💩.' });
          return;
        }

        // default to 1 if there are no lists (new user)
        let newPosition = 1;

        if (lastCard) {
          // but use the last list's position (+1) if we have one
          newPosition = lastCard.position + 1;
        }

        const theCard = new CardModel({
          title: req.body.cardTitle,
          position: newPosition,
          list: req.params.id
        });

        theCard.save((err) => {
          if (err) {
            res.status(500).json({ message: 'Card save went to 💩'});
          }
          ListModel.findByIdAndUpdate(
            req.params.id,
            { $push: { cards: theCard._id }},
            (err, listFromDB) => {
              if (err) {
                res.status(500).json({ message: 'List update went to 💩'});
                return;
              }
              res.status(200).json(theCard);
            }
          );
        });
    });
});

router.patch('/api/cards/:id', (req, res, next) => {
  CardModel.findById(
    req.params.id,
    (err, cardFromDB) =>{
      if (err) {
        res.status(500).json({ message: 'Card Find went to 💩'});
        return;
      }
      if(req.body.cardTitle) {
        cardFromDB.title = req.body.cardTitle;
      }
      if(req.body.cardDescription) {
        cardFromDB.description = req.body.cardDescription;
      }
      if(req.body.cardDueDate) {
        cardFromDB.dueDate = req.body.cardDueDate;
      }
      cardFromDB.save((err) => {
        if (err) {
          res.status(500).json({ message: 'Card save went to 💩'});
          return;
        }
        res.status(200).json(cardFromDB);
      });
    }
  );
});

router.delete('/api/cards/:id', (req, res, next) => {
  CardModel.findByIdAndRemove(
    req.params.id,
    (err, cardFromDB) => {
      if (err) {
        res.status(500).json({ message: 'Card remove went to 💩' });
        return;
      }
      ListModel.findByIdAndUpdate(
        cardFromDB.list,
        { $pull: { cards: cardFromDB._id }},
        (err) => {
          if (err) {
            res.status(500).json({ message: 'List update went to 💩'});
            return;
          }
        }
      );
    }
  );
});

module.exports = router;
