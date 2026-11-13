library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity top_module is
    port (
        source : in std_logic;
        left_signal : in std_logic;
        right_signal : in std_logic;
        connected : out std_logic;
        same : out std_logic;
        conflict_free : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    -- Task 1. Restore the missing connection: implement this requirement.
    -- Task 2. Compare definite inputs: implement this requirement.
    -- Task 3. Resolve the competing driver: implement this requirement.
    connected <= '0';
    same <= '0';
    conflict_free <= '0';
end architecture;
