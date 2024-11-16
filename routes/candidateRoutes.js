const express = require("express");
const router = express.Router();
const User = require('./../models/user');
const Candidate = require("../models/candidate");
const { jwtAuthMiddleware } = require("../jwt");

// Function to check admin-role

const checkRole = async (userId) => {
  try {
    const user = await User.findById(userId);
    return user.role === 'admin';

  } catch (error) {
    return false;
  }
}

router.post("/", jwtAuthMiddleware, async (req, res) => {


  try {

    if(!await checkRole(req.user.id))
       return res.status(403).json({message: `User not had admin role`});

    const data = req.body;

    const newCandidate = new Candidate(data);

    const response = await newCandidate.save();
    console.log("Candidate registered sucessfully");

    res.status(200).json({ response: response});
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: `Internal server error` });
  }
});

router.put('/:candidateId', jwtAuthMiddleware, async (req, res) => {
  try {

    if(!await checkRole(req.user.id))
      return res.status(403).json({message: `User not had admin role`});

    const candidateId = req.params.candidateId;
    const updatedCandidateData = req.body;

    const response = await Candidate.findByIdAndUpdate(
      candidateId,
      updatedCandidateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!response) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    console.log("candidate data updated");
    res.status(200).json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: `Internal Server Error` });
  }
})

router.delete('/:candidateId', jwtAuthMiddleware, async (req, res) => {
  try {

    if(!await checkRole(req.user.id))
      return res.status(403).json({message: `User not had admin role`});

    const candidateId = req.params.candidateId;

    const response = await Candidate.findByIdAndDelete(candidateId)

    if (!response) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    console.log("candidate data deleted");
    res.status(200).json({message: `Candidate deleted`});
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: `Internal Server Error` });
  }
})


// voting count

router.post('/vote/:candidateId', jwtAuthMiddleware, async( req, res) => {
  // no admin can vote
  candidateId = req.params.candidateId;
  userId = req.user.id;

  try {
    
    const candidate = await Candidate.findById(candidateId);
    if(!candidate) {
      return res.status(404).json({message: `Candidate not found`});
    }

    const user  = await User.findById(userId);
    if(!user) {
      return res.status(404).json({message: `User not found`});
    }

    if(user.isVoted){
      return res.status(400).json({message: `You have already voted`});
    }

    if(user.role == 'admin'){
      return res.status(403).json({message: `Admin not allowed to vote`});
    }

    // update the candidate on vote
    candidate.votes.push({user: userId});
    candidate.voteCount++;
    await candidate.save();

    // update user voting count
    user.isVoted = true;
    await user.save();

    res.status(200).json({message: `Vote recorded sucessfully`});
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: `Internal Server Error` });
  }
})


// router.get('/vote/count/:candidateId', async (req, res) => {
//   try {
    
//     candidateId = req.params.candidateId;

//     const candidate = await Candidate.findById(candidateId);
//     if(!candidate) {
//       return res.status(404).json({message: `Candidate not found`});
//     }

//     res.status(200).json({message: `Candidate ${candidate.name} has ${candidate.voteCount} votes`});

//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ error: `Internal Server Error` });
//   }
// })

router.get('/vote/count', async (req, res) => {
  try {

    const candidate = await Candidate.find().sort({voteCount: 'desc'});

    const voteRecord = candidate.map((data) => {
      return {
        party : data.party,
        count : data.voteCount
      }
    })

    return res.status(200).json(voteRecord);
    
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: `Internal Server Error` });
  }
})

module.exports = router;
