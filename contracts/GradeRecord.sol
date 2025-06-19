// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title GradeRecord
 * @dev 用于存储学生成绩的智能合约
 */
contract GradeRecord {
    // 成绩记录结构
    struct Grade {
        string studentId; // 学生ID
        string courseId; // 课程ID
        uint score; // 分数
        string semester; // 学期
        uint timestamp; // 记录时间戳
        string teacherId; // 教师ID
        string metadata; // 其他元数据 (JSON格式)
    }

    // 记录ID到成绩的映射
    mapping(bytes32 => Grade) private grades;

    // 所有记录ID列表
    bytes32[] private gradeIds;

    // 学生ID到其所有成绩记录ID的映射
    mapping(string => bytes32[]) private studentGrades;

    // 事件定义
    event GradeAdded(
        bytes32 indexed gradeId,
        string studentId,
        string courseId,
        uint score,
        uint timestamp
    );
    event GradeVerified(
        bytes32 indexed gradeId,
        address verifier,
        uint timestamp
    );

    /**
     * @dev 添加新的成绩记录
     * @param _studentId 学生ID
     * @param _courseId 课程ID
     * @param _score 分数
     * @param _semester 学期
     * @param _teacherId 教师ID
     * @param _metadata 其他元数据
     * @return gradeId 生成的成绩记录ID
     */
    function addGrade(
        string memory _studentId,
        string memory _courseId,
        uint _score,
        string memory _semester,
        string memory _teacherId,
        string memory _metadata
    ) public returns (bytes32) {
        // 生成唯一ID
        bytes32 gradeId = keccak256(
            abi.encodePacked(_studentId, _courseId, _semester, block.timestamp)
        );

        // 创建成绩记录
        Grade memory newGrade = Grade({
            studentId: _studentId,
            courseId: _courseId,
            score: _score,
            semester: _semester,
            timestamp: block.timestamp,
            teacherId: _teacherId,
            metadata: _metadata
        });

        // 存储记录
        grades[gradeId] = newGrade;
        gradeIds.push(gradeId);
        studentGrades[_studentId].push(gradeId);

        // 触发事件
        emit GradeAdded(
            gradeId,
            _studentId,
            _courseId,
            _score,
            block.timestamp
        );

        return gradeId;
    }

    /**
     * @dev 获取成绩记录
     * @param _gradeId 成绩记录ID
     * @return studentId 学生ID
     * @return courseId 课程ID
     * @return score 分数
     * @return semester 学期
     * @return timestamp 时间戳
     * @return teacherId 教师ID
     * @return metadata 元数据
     */
    function getGrade(
        bytes32 _gradeId
    )
        public
        view
        returns (
            string memory studentId,
            string memory courseId,
            uint score,
            string memory semester,
            uint timestamp,
            string memory teacherId,
            string memory metadata
        )
    {
        Grade memory grade = grades[_gradeId];
        return (
            grade.studentId,
            grade.courseId,
            grade.score,
            grade.semester,
            grade.timestamp,
            grade.teacherId,
            grade.metadata
        );
    }

    /**
     * @dev 验证成绩记录是否存在
     * @param _gradeId 成绩记录ID
     * @return exists 成绩记录是否存在
     */
    function verifyGrade(bytes32 _gradeId) public returns (bool exists) {
        exists = grades[_gradeId].timestamp > 0;

        if (exists) {
            emit GradeVerified(_gradeId, msg.sender, block.timestamp);
        }

        return exists;
    }

    /**
     * @dev 获取学生的所有成绩记录ID
     * @param _studentId 学生ID
     * @return studentGradeIds 成绩记录ID数组
     */
    function getStudentGradeIds(
        string memory _studentId
    ) public view returns (bytes32[] memory studentGradeIds) {
        return studentGrades[_studentId];
    }

    /**
     * @dev 获取所有成绩记录的数量
     * @return count 成绩记录总数
     */
    function getGradeCount() public view returns (uint count) {
        return gradeIds.length;
    }

    /**
     * @dev 获取指定索引的成绩记录ID
     * @param _index 索引
     * @return gradeId 成绩记录ID
     */
    function getGradeIdAtIndex(
        uint _index
    ) public view returns (bytes32 gradeId) {
        require(_index < gradeIds.length, "Index out of bounds");
        return gradeIds[_index];
    }
}
