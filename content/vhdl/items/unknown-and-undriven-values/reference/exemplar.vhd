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
    connected <= source; same <= '1' when left_signal=right_signal else '0'; conflict_free <= source;
end architecture;
