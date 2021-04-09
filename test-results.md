# Test results

```shell
  Governance
    General tests
      ✓ should be deployed
      ✓ is able to receive ethers
    activate
      ✓ reverts if threshold not yet met (38ms)
      ✓ activates if threshold is met (54ms)
      ✓ reverts if already activated (54ms)
    propose
      ✓ create new proposal revert reasons (364ms)
      ✓ create new proposal (261ms)
      ✓ start vote && quorum (147ms)
      ✓ cast, cancel and change vote (415ms)
      ✓ castVote fails if user does not have voting power (136ms)
      ✓ cannot vote when vote is closed (212ms)
      ✓ verify proposal state (457ms)
      ✓ cannot execute proposals that are not queued (127ms)
      ✓ test proposal execution in queued mode (298ms)
      ✓ cannot cancel expired, failed or executed proposals (423ms)
      ✓ fail for invalid quorum (195ms)
      ✓ fail for invalid minimum threshold (352ms)
      ✓ test change periods (509ms)
      ✓ proposer cancel proposal (146ms)
      ✓ allows anyone to cancel a proposal if creator balance fell below threshold (199ms)
      ✓ allows cancellation only when proposal is in warmup or active state (388ms)
      ✓ test proposal with only value transfer (260ms)
    abrogation proposal
      ✓ reverts if proposal id is not valid
      ✓ works only if proposal is in queued state (571ms)
      ✓ fails if user does not voting power above threshold (257ms)
      voting
        ✓ reverts for invalid proposal id
        ✓ reverts if abrogation proposal is not created (93ms)
        ✓ reverts if abrogation proposal expired (281ms)
        ✓ reverts if user does not have voting power (266ms)
        ✓ reverts if user tries to double vote (263ms)
        ✓ updates the amount of votes (289ms)
        ✓ allows user to change vote (311ms)
        ✓ changes initial proposal state to cancelled if accepted (376ms)
        ✓ does not change initial proposal state if not accepted (324ms)
      cancel vote
        ✓ reverts if abrogation proposal is not created (89ms)
        ✓ reverts if abrogation proposal expired (220ms)
        ✓ reverts if user tries to cancel vote if not voted (249ms)
        ✓ allows users to cancel their votes (301ms)
      abrogateProposal
        ✓ reverts if proposal state is not canceled (91ms)
        ✓ reverts if abrogate proposal failed (301ms)
        ✓ works if abrogation proposal was accepted (353ms)
    stored parameters
      ✓ stores parameters on proposal on creation (108ms)
      ✓ parameters changed mid-flight do not affect running proposals (728ms)


  43 passing (11s)

-----------------------|----------|----------|----------|----------|----------------|
File                   |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
-----------------------|----------|----------|----------|----------|----------------|
 contracts/            |    95.31 |    84.06 |    92.11 |    95.33 |                |
  Bridge.sol           |      100 |       75 |      100 |      100 |                |
  Governance.sol       |    94.54 |    85.34 |    88.89 |    94.54 |... 463,472,473 |
  Parameters.sol       |      100 |    78.57 |      100 |      100 |                |
 contracts/interfaces/ |      100 |      100 |      100 |      100 |                |
  IBarn.sol            |      100 |      100 |      100 |      100 |                |
  IBridge.sol          |      100 |      100 |      100 |      100 |                |
-----------------------|----------|----------|----------|----------|----------------|
All files              |    95.31 |    84.06 |    92.11 |    95.33 |                |
-----------------------|----------|----------|----------|----------|----------------|
```
