import dotenv from "dotenv";
import express from "express";
import { check, validationResult } from 'express-validator';
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import auth from "../middleware/auth.js"; 
import userModel from '../models/user.js';

const router = express.Router();
dotenv.config();

router.get('/', auth, async (req, res) => {

    await userModel.findById(req.user.id).select('-password')
    .then (data => {
        // res.send({status: 200, data: data});
        res.status(200).json({ data: data });
    })
    .catch (err => {
        // res.send({status: 500, errors: [{ msg: "Server error authenticating user" }]});
        res.status(500).json({ errors: [{ msg: "Server error authenticating user" }] });
    })
})

router.post('/', [
    check('email', 'Enter a valid email').isEmail(),
    check('password', 'Password is required').not().isEmpty()
    ], 
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // return res.send({status: 400, errors: errors.array()});
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        const user = await userModel.findOne({email: email});

        if (!user) {
            // return res.send({status: 400, errors: [{ msg: "Wrong credentials" }]});
            return res.status(400).json({ errors: [{ msg: "Wrong credentials" }] });
        }

        const isFound = await bcrypt.compare(password, user.password)
        
        if (!isFound){
            // return res.send({status: 400, errors: [{ msg: "Wrong credentials" }]});
            return res.status(400).json({ errors: [{ msg: "Wrong credentials" }] });
        }

        const payload = {
            user : { id: user.id }
        }

        jwt.sign(payload, process.env.JWT_SECRET, 
            { expiresIn: 1200 }, (err, token) => { // might want to change this later
                if (err) throw err;
                else res.send({ token })
        });
    }
)


export default router;